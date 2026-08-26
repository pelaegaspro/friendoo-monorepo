import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {corsHeaders, error, json, serviceClient} from '../_shared/http.ts';

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

function signaturesMatch(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', {headers: corsHeaders});
  if (request.method !== 'POST') return error('Method not allowed', 405);

  const environment = Deno.env.get('CASHFREE_ENVIRONMENT') === 'production'
    ? 'production'
    : 'sandbox';
  const secret = Deno.env.get(
    environment === 'production' ? 'CASHFREE_SECRET_KEY' : 'CASHFREE_SANDBOX_SECRET_KEY',
  );
  const timestamp = request.headers.get('x-webhook-timestamp');
  const signature = request.headers.get('x-webhook-signature');
  if (!secret || !timestamp || !signature) return error('Invalid webhook request', 401);

  // Enforce timestamp freshness (300s window to prevent replay attacks)
  const webhookTimestamp = parseInt(timestamp, 10);
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (isNaN(webhookTimestamp) || Math.abs(nowSeconds - webhookTimestamp) > 300) {
    return error('Webhook timestamp outside tolerance / expired', 401);
  }

  const rawPayload = await request.text();
  const expected = await expectedSignature(secret, timestamp, rawPayload);
  if (!signaturesMatch(expected, signature)) return error('Invalid webhook signature', 401);

  try {
    const event = JSON.parse(rawPayload) as {
      event?: string;
      data?: {
        order?: {order_id?: string; customer_details?: {customer_id?: string}};
        payment?: {cf_payment_id?: string; payment_method?: string};
      };
    };
    const eventType = (event.event ?? '').replace(/_WEBHOOK$/, '');
    const orderId = event.data?.order?.order_id;
    if (!orderId) return error('Missing order_id');

    const admin = serviceClient();
    if (eventType === 'PAYMENT_SUCCESS' || eventType === 'PAYMENT_CHARGES') {
      const paymentId = event.data?.payment?.cf_payment_id;
      if (!paymentId) return error('Missing payment identifier');
      const {data, error: rpcError} = await admin.rpc('credit_friendoo_payment', {
        p_provider_order_id: orderId,
        p_payment_id: paymentId,
        p_payment_method: event.data?.payment?.payment_method ?? 'unknown',
      });
      if (rpcError) throw rpcError;
      return json({status: 'credited', order: data});
    }

    if (eventType === 'PAYMENT_FAILED') {
      const {error: rpcError} = await admin.rpc('set_friendoo_payment_status', {
        p_provider_order_id: orderId,
        p_status: 'failed',
      });
      if (rpcError) throw rpcError;
      return json({status: 'failed'});
    }

    if (['DISPUTE_OPENED', 'DISPUTE_CREATED', 'DISPUTE_UPDATED', 'DISPUTE'].includes(eventType)) {
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
      return json({status: 'dispute_opened'});
    }

    if (['DISPUTE_CLOSED', 'DISPUTE_RESOLVED', 'DISPUTE_COMPLETED'].includes(eventType)) {
      const {error: freezeError} = await admin.rpc('freeze_friendoo_wallet_for_dispute', {
        p_provider_order_id: orderId,
        p_frozen: false,
      });
      if (freezeError) throw freezeError;
      return json({status: 'dispute_resolved'});
    }

    return json({status: 'ignored'});
  } catch (caught) {
    console.error('cashfree-webhook failed', caught);
    return error('Unable to process webhook', 500);
  }
});
