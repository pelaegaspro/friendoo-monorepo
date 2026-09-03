import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {
  allowedCorsHeaders,
  error,
  json,
  readBodyLimited,
  recordSecurityEvent,
  serviceClient,
} from '../_shared/http.ts';

const CASHFREE_WEBHOOK_MAX_BYTES = 32 * 1024;
const supportedEvents = new Set([
  'PAYMENT_SUCCESS',
  'PAYMENT_CHARGES',
  'PAYMENT_FAILED',
  'DISPUTE_OPENED',
  'DISPUTE_CREATED',
  'DISPUTE_UPDATED',
  'DISPUTE',
  'DISPUTE_CLOSED',
  'DISPUTE_RESOLVED',
  'DISPUTE_COMPLETED',
]);

type CashfreeWebhook = {
  type?: string;
  event?: string;
  data?: {
    order?: {order_id?: string; customer_details?: {customer_id?: string}};
    payment?: {
      cf_payment_id?: string;
      payment_group?: string;
      payment_method?: string;
    };
  };
};

async function expectedSignature(secret: string, timestamp: string, rawPayload: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${timestamp}${rawPayload}`),
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function signaturesMatch(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function isProviderIdentifier(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
}

function eventTypeFrom(payload: CashfreeWebhook) {
  return (payload.type ?? payload.event ?? '').replace(/_WEBHOOK$/, '');
}

Deno.serve(async (request) => {
  const responseHeaders = allowedCorsHeaders(request);
  if (request.method === 'OPTIONS') return new Response('ok', {headers: responseHeaders});
  if (request.method !== 'POST') return error('Method not allowed', 405, responseHeaders);

  const environment = Deno.env.get('CASHFREE_ENVIRONMENT') === 'production'
    ? 'production'
    : 'sandbox';
  const secret = Deno.env.get(
    environment === 'production' ? 'CASHFREE_SECRET_KEY' : 'CASHFREE_SANDBOX_SECRET_KEY',
  );
  const timestamp = request.headers.get('x-webhook-timestamp');
  const signature = request.headers.get('x-webhook-signature');
  const webhookVersion = request.headers.get('x-webhook-version');
  if (!secret || !timestamp || !signature || !webhookVersion) {
    return error('Invalid webhook request', 401, responseHeaders);
  }

  const webhookTimestamp = Number(timestamp);
  const nowMilliseconds = Date.now();
  if (
    !Number.isInteger(webhookTimestamp) ||
    Math.abs(nowMilliseconds - webhookTimestamp) > 5 * 60 * 1000
  ) {
    return error('Webhook timestamp outside tolerance', 401, responseHeaders);
  }

  let admin: ReturnType<typeof serviceClient> | null = null;
  let eventFingerprint: string | null = null;
  let eventType = 'unknown';
  let orderId: string | null = null;

  try {
    const rawPayload = await readBodyLimited(request, CASHFREE_WEBHOOK_MAX_BYTES);
    const expected = await expectedSignature(secret, timestamp, rawPayload);
    if (!signaturesMatch(expected, signature)) return error('Invalid webhook signature', 401, responseHeaders);

    let event: CashfreeWebhook;
    try {
      event = JSON.parse(rawPayload) as CashfreeWebhook;
    } catch {
      return error('Invalid webhook payload', 400, responseHeaders);
    }

    eventType = eventTypeFrom(event);
    orderId = event.data?.order?.order_id ?? null;
    const paymentId = event.data?.payment?.cf_payment_id ?? null;
    if (!supportedEvents.has(eventType) || !isProviderIdentifier(orderId)) {
      return error('Unsupported webhook event', 400, responseHeaders);
    }
    if ((eventType === 'PAYMENT_SUCCESS' || eventType === 'PAYMENT_CHARGES') && !isProviderIdentifier(paymentId)) {
      return error('Missing payment identifier', 400, responseHeaders);
    }

    eventFingerprint = await sha256(`cashfree:${eventType}:${orderId}:${paymentId ?? ''}`);
    admin = serviceClient();

    const {data: reservation, error: reservationError} = await admin.rpc('reserve_webhook_event', {
      p_provider: 'cashfree',
      p_event_fingerprint: eventFingerprint,
      p_event_type: eventType,
      p_provider_order_id: orderId,
      p_metadata: {environment, webhook_version: webhookVersion},
    });
    if (reservationError || !reservation?.accepted) {
      await recordSecurityEvent(admin, {
        eventType: 'cashfree.webhook.duplicate',
        outcome: 'duplicate',
        targetType: 'payment_order',
        targetId: orderId,
        requestFingerprint: eventFingerprint,
        metadata: {event_type: eventType},
      });
      return json({status: 'duplicate'}, 200, responseHeaders);
    }

    let status: 'processed' | 'ignored' = 'processed';
    if (eventType === 'PAYMENT_SUCCESS' || eventType === 'PAYMENT_CHARGES') {
      const {error: rpcError} = await admin.rpc('credit_friendoo_payment', {
        p_provider_order_id: orderId,
        p_payment_id: paymentId,
          p_payment_method: typeof event.data?.payment?.payment_group === 'string'
          ? event.data.payment.payment_group.slice(0, 64)
          : typeof event.data?.payment?.payment_method === 'string'
          ? event.data.payment.payment_method.slice(0, 64)
          : 'unknown',
      });
      if (rpcError) throw rpcError;
    } else if (eventType === 'PAYMENT_FAILED') {
      const {error: rpcError} = await admin.rpc('set_friendoo_payment_status', {
        p_provider_order_id: orderId,
        p_status: 'failed',
      });
      if (rpcError) throw rpcError;
    } else if (['DISPUTE_OPENED', 'DISPUTE_CREATED', 'DISPUTE_UPDATED', 'DISPUTE'].includes(eventType)) {
      const {error: statusError} = await admin.rpc('set_friendoo_payment_status', {
        p_provider_order_id: orderId,
        p_status: 'disputed',
      });
      if (statusError) throw statusError;
      const {error: freezeError} = await admin.rpc('freeze_friendoo_wallet_for_dispute', {
        p_provider_order_id: orderId,
        p_frozen: true,
      });
      if (freezeError) throw freezeError;
    } else if (['DISPUTE_CLOSED', 'DISPUTE_RESOLVED', 'DISPUTE_COMPLETED'].includes(eventType)) {
      const {error: freezeError} = await admin.rpc('freeze_friendoo_wallet_for_dispute', {
        p_provider_order_id: orderId,
        p_frozen: false,
      });
      if (freezeError) throw freezeError;
    } else {
      status = 'ignored';
    }

    const {error: completeError} = await admin.rpc('complete_webhook_event', {
      p_provider: 'cashfree',
      p_event_fingerprint: eventFingerprint,
      p_status: status,
    });
    if (completeError) throw completeError;

    await recordSecurityEvent(admin, {
      eventType: 'cashfree.webhook.accepted',
      outcome: 'accepted',
      targetType: 'payment_order',
      targetId: orderId,
      requestFingerprint: eventFingerprint,
      metadata: {event_type: eventType, status, webhook_version: webhookVersion},
    });
    return json({status}, 200, responseHeaders);
  } catch (caught) {
    if (admin && eventFingerprint) {
      await admin.rpc('complete_webhook_event', {
        p_provider: 'cashfree',
        p_event_fingerprint: eventFingerprint,
        p_status: 'failed',
      });
      await recordSecurityEvent(admin, {
        eventType: 'cashfree.webhook.failed',
        outcome: 'failed',
        targetType: 'payment_order',
        targetId: orderId,
        requestFingerprint: eventFingerprint,
        metadata: {event_type: eventType},
      });
    }
    const code = caught instanceof Error && caught.message === 'REQUEST_BODY_TOO_LARGE' ? 413 : 500;
    console.error('cashfree-webhook failed', eventType, code);
    return error(code === 413 ? 'Request body too large' : 'Unable to process webhook', code, responseHeaders);
  }
});
