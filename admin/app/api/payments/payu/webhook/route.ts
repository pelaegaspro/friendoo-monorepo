import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
const PAYU_KEY = process.env.PAYU_MERCHANT_KEY || '7eMBxs';
const PAYU_SALT = process.env.PAYU_MERCHANT_SALT || 'b5WvAHEHIKX35H1Kppq745Bbmo01dHRa';

export async function POST(req: NextRequest) {
  try {
    let payload: Record<string, string> = {};

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        payload[key] = String(value);
      });
    } else {
      payload = await req.json().catch(() => ({}));
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
      return NextResponse.json({ error: 'Incomplete PayU webhook payload' }, { status: 400 });
    }

    // Verify reverse hash
    // Standard: sha512(salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    // Surcharge: sha512(additionalCharges|salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    let hashSeq = `${status}||||||${udf5 || ''}|${udf4 || ''}|${udf3 || ''}|${udf2 || ''}|${udf1 || ''}|${email || ''}|${firstname || ''}|${productinfo || ''}|${amount || ''}|${txnid}|${key || PAYU_KEY}`;
    
    let expectedHash: string;
    if (additionalCharges) {
      expectedHash = crypto.createHash('sha512').update(`${additionalCharges}|${PAYU_SALT}|${hashSeq}`).digest('hex');
    } else {
      expectedHash = crypto.createHash('sha512').update(`${PAYU_SALT}|${hashSeq}`).digest('hex');
    }

    if (expectedHash.toLowerCase() !== hash.toLowerCase()) {
      console.error('PayU Hash Mismatch! Expected:', expectedHash, 'Received:', hash);
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    if (status.toLowerCase() === 'success') {
      // 1. Credit wallet atomically via server RPC
      const { data, error: rpcError } = await supabase.rpc('credit_friendoo_payment', {
        p_provider_order_id: txnid,
        p_payment_id: mihpayid || txnid,
        p_payment_method: mode || 'UPI',
      });

      if (rpcError) {
        console.error('Failed to credit payment RPC:', rpcError);
        // If RPC is missing or fails, update order directly
        await supabase
          .from('payment_orders')
          .update({ status: 'success', updated_at: new Date().toISOString() })
          .eq('provider_order_id', txnid);
      }

      // If this request came from a browser redirect (surl), redirect to payment success page
      if (req.headers.get('accept')?.includes('text/html')) {
        return NextResponse.redirect(new URL('/payment-success', req.url));
      }

      return NextResponse.json({ status: 'credited', txnid, data });
    } else {
      // Failed payment
      await supabase
        .from('payment_orders')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('provider_order_id', txnid);

      if (req.headers.get('accept')?.includes('text/html')) {
        return NextResponse.redirect(new URL('/payment-failed', req.url));
      }

      return NextResponse.json({ status: 'failed', txnid });
    }
  } catch (err: unknown) {
    console.error('PayU Webhook Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
