import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, error, json, serviceClient } from '../_shared/http.ts';

const PAYU_KEY = Deno.env.get('PAYU_MERCHANT_KEY') ?? '7eMBxs';
const PAYU_SALT = Deno.env.get('PAYU_MERCHANT_SALT') ?? 'b5WvAHEHIKX35H1Kppq745Bbmo01dHRa';

async function sha512Hex(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-512', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return error('Method not allowed', 405);

  try {
    let payload: Record<string, string> = {};
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        payload[key] = String(value);
      });
    } else {
      payload = await request.json().catch(() => ({}));
    }

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

    if (!txnid || !status || !hash) {
      return error('Incomplete PayU webhook payload', 400);
    }

    // Verify reverse hash
    const hashSeq = `${status}||||||${udf5 || ''}|${udf4 || ''}|${udf3 || ''}|${udf2 || ''}|${udf1 || ''}|${email || ''}|${firstname || ''}|${productinfo || ''}|${amount || ''}|${txnid}|${key || PAYU_KEY}`;
    
    let expectedHash: string;
    if (additionalCharges) {
      expectedHash = await sha512Hex(`${additionalCharges}|${PAYU_SALT}|${hashSeq}`);
    } else {
      expectedHash = await sha512Hex(`${PAYU_SALT}|${hashSeq}`);
    }

    if (expectedHash.toLowerCase() !== hash.toLowerCase()) {
      console.error('PayU Hash Mismatch! Expected:', expectedHash, 'Received:', hash);
      return error('Signature verification failed', 401);
    }

    const admin = serviceClient();

    if (status.toLowerCase() === 'success') {
      const { data, error: rpcError } = await admin.rpc('credit_friendoo_payment', {
        p_provider_order_id: txnid,
        p_payment_id: mihpayid || txnid,
        p_payment_method: mode || 'UPI',
      });
      if (rpcError) throw rpcError;
      return json({ status: 'credited', order: data });
    } else {
      const { error: rpcError } = await admin.rpc('set_friendoo_payment_status', {
        p_provider_order_id: txnid,
        p_status: 'failed',
      });
      if (rpcError) throw rpcError;
      return json({ status: 'failed', txnid });
    }
  } catch (caught) {
    console.error('PayU webhook execution failed', caught);
    return error('Webhook processing failed', 500);
  }
});
