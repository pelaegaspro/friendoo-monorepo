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

async function expectedSignature(secret: string, timestamp: string, rawPayload: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${timestamp}${rawPayload}`)
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
  const responseHeaders = allowedCorsHeaders(request);
  if (request.method === 'OPTIONS') return new Response('ok', { headers: responseHeaders });
  if (request.method !== 'POST') return error('Method not allowed', 405, responseHeaders);

  const environment = Deno.env.get('CASHFREE_ENVIRONMENT') === 'production'
    ? 'production'
    : 'sandbox';
  const secret = Deno.env.get('CASHFREE_PAYOUT_CLIENT_SECRET') ||
    Deno.env.get(environment === 'production' ? 'CASHFREE_SECRET_KEY' : 'CASHFREE_SANDBOX_SECRET_KEY');

  const timestamp = request.headers.get('x-webhook-timestamp');
  const signature = request.headers.get('x-webhook-signature');

  // Verify signature if secret and signature are provided
  if (secret && signature && timestamp) {
    const rawPayload = await readBodyLimited(request, CASHFREE_WEBHOOK_MAX_BYTES);
    const expected = await expectedSignature(secret, timestamp, rawPayload);
    if (!signaturesMatch(expected, signature)) {
      return error('Invalid webhook signature', 401, responseHeaders);
    }
  }

  try {
    const rawPayload = await request.text();
    const payload = JSON.parse(rawPayload);

    const eventType = String(
      payload.event || payload.type || payload.event_type || ''
    ).toUpperCase();

    const data = payload.data || payload;
    const transferId = String(
      data.transfer_id || data.transferId || data.referenceId || ''
    );
    const cfTransferId = String(
      data.cf_transfer_id || data.cfTransferId || ''
    );
    const status = String(
      data.status || data.transfer_status || ''
    ).toUpperCase();
    const failureReason = String(
      data.status_description || data.failure_reason || data.message || 'Transfer failed'
    );

    if (!transferId) {
      return json({ status: 'ignored', message: 'No transfer_id' }, 200, responseHeaders);
    }

    const admin = serviceClient();

    const { data: payout, error: lookupError } = await admin
      .from('host_payouts')
      .select('id, status')
      .eq('provider_transfer_id', transferId)
      .maybeSingle();

    if (lookupError || !payout) {
      return json({ status: 'ignored', message: 'Payout not found' }, 200, responseHeaders);
    }

    if (payout.status === 'paid') {
      return json({ status: 'duplicate', message: 'Payout already marked paid' }, 200, responseHeaders);
    }

    if (eventType === 'TRANSFER_SUCCESS' || status === 'SUCCESS') {
      const { error: rpcError } = await admin.rpc('record_host_payout_provider_result', {
        p_payout_id: payout.id,
        p_success: true,
        p_provider: 'cashfree',
        p_provider_transfer_id: transferId,
        p_provider_reference_id: cfTransferId || null,
        p_failure_reason: null,
      });

      if (rpcError) throw rpcError;

      await recordSecurityEvent(admin, {
        eventType: 'cashfree.payout.success',
        outcome: 'accepted',
        targetType: 'host_payout',
        targetId: payout.id,
        metadata: { transfer_id: transferId, cf_transfer_id: cfTransferId },
      });

      return json({ status: 'processed', result: 'paid' }, 200, responseHeaders);
    } else if (
      eventType === 'TRANSFER_FAILED' ||
      eventType === 'TRANSFER_REVERSED' ||
      status === 'FAILED' ||
      status === 'REJECTED'
    ) {
      const { error: rpcError } = await admin.rpc('record_host_payout_provider_result', {
        p_payout_id: payout.id,
        p_success: false,
        p_provider: 'cashfree',
        p_provider_transfer_id: transferId,
        p_provider_reference_id: cfTransferId || null,
        p_failure_reason: failureReason,
      });

      if (rpcError) throw rpcError;

      await recordSecurityEvent(admin, {
        eventType: 'cashfree.payout.failed',
        outcome: 'failed',
        targetType: 'host_payout',
        targetId: payout.id,
        metadata: { transfer_id: transferId, failure_reason: failureReason },
      });

      return json({ status: 'processed', result: 'failed_and_refunded' }, 200, responseHeaders);
    }

    return json({ status: 'ignored' }, 200, responseHeaders);
  } catch (err) {
    console.error('cashfree-payout-webhook failed', err);
    return error('Unable to process payout webhook', 500, responseHeaders);
  }
});

