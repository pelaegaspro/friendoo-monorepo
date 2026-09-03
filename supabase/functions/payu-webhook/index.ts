import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {corsHeaders, error, json, readBodyLimited, serviceClient} from '../_shared/http.ts';

const PAYU_WEBHOOK_MAX_BYTES = 32 * 1024;

async function sha512Hex(message: string): Promise<string> {
  const bytes = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-512', bytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  let difference = leftBytes.length ^ rightBytes.length;
  const length = Math.max(leftBytes.length, rightBytes.length);
  for (let index = 0; index < length; index++) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return difference === 0;
}

function parsePayuPayload(raw: string, contentType: string): Record<string, string> {
  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(raw));
  }
  if (contentType.includes('application/json')) {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed).map(([key, value]) => [key, String(value)]),
      );
    }
  }
  throw new Error('INVALID_PAYU_WEBHOOK_PAYLOAD');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', {headers: corsHeaders});
  if (request.method !== 'POST') return error('Method not allowed', 405);

  try {
    const payuKey = Deno.env.get('PAYU_MERCHANT_KEY');
    const payuSalt = Deno.env.get('PAYU_MERCHANT_SALT');
    if (!payuKey || !payuSalt) {
      return error('Payment provider is unavailable', 503);
    }

    const contentType = request.headers.get('content-type') ?? '';
    const raw = await readBodyLimited(request, PAYU_WEBHOOK_MAX_BYTES);
    const payload = parsePayuPayload(raw, contentType);
    const {
      status,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      hash,
      key,
      mihpayid,
      mode,
      additionalCharges,
    } = payload;

    if (!txnid || !status || !hash || key !== payuKey) {
      return error('Invalid PayU webhook payload', 400);
    }

    const hashSequence = `${status}||||||${udf5 ?? ''}|${udf4 ?? ''}|${udf3 ?? ''}|${udf2 ?? ''}|${udf1 ?? ''}|${email ?? ''}|${firstname ?? ''}|${productinfo ?? ''}|${amount ?? ''}|${txnid}|${payuKey}`;
    const expectedHash = additionalCharges
      ? await sha512Hex(`${additionalCharges}|${payuSalt}|${hashSequence}`)
      : await sha512Hex(`${payuSalt}|${hashSequence}`);

    if (!constantTimeEqual(expectedHash.toLowerCase(), hash.toLowerCase())) {
      console.error('PayU signature verification failed');
      return error('Signature verification failed', 401);
    }

    const admin = serviceClient();
    if (status.toLowerCase() === 'success') {
      const {data, error: rpcError} = await admin.rpc('credit_friendoo_payment', {
        p_provider_order_id: txnid,
        p_payment_id: mihpayid || txnid,
        p_payment_method: mode || 'UPI',
      });
      if (rpcError) throw rpcError;
      return json({status: 'credited', order: data});
    }

    const {error: rpcError} = await admin.rpc('set_friendoo_payment_status', {
      p_provider_order_id: txnid,
      p_status: 'failed',
    });
    if (rpcError) throw rpcError;
    return json({status: 'failed', txnid});
  } catch (caught) {
    console.error('PayU webhook execution failed', caught);
    const status = caught instanceof Error && caught.message === 'REQUEST_BODY_TOO_LARGE'
      ? 413
      : caught instanceof Error && caught.message === 'INVALID_PAYU_WEBHOOK_PAYLOAD'
      ? 400
      : 500;
    return error(status === 413 ? 'Request body is too large' : 'Webhook processing failed', status);
  }
});
