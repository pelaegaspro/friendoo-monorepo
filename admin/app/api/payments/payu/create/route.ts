import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

const PAYU_KEY = process.env.PAYU_MERCHANT_KEY || '7eMBxs';
const PAYU_SALT = process.env.PAYU_MERCHANT_SALT || 'b5WvAHEHIKX35H1Kppq745Bbmo01dHRa';
const IS_PRODUCTION = process.env.PAYU_ENV === 'production';
const PAYU_ACTION_URL = IS_PRODUCTION 
  ? 'https://secure.payu.in/_payment' 
  : 'https://test.payu.in/_payment';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, packageId, phone, email, firstname } = body;

    if (!packageId) {
      return NextResponse.json({ error: 'package_id is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1. Fetch package price
    const { data: pkg, error: pkgError } = await supabase
      .from('coin_packages')
      .select('id, coins, amount_inr, is_active')
      .eq('id', packageId)
      .single();

    if (pkgError || !pkg) {
      return NextResponse.json({ error: 'Coin package not found' }, { status: 404 });
    }

    // 2. Generate unique Transaction ID
    const txnid = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const amount = Number(pkg.amount_inr).toFixed(2);
    const productinfo = `Friendoo_${pkg.coins}_Coins`;
    const customerName = (firstname || 'Friendoo User').trim();
    const customerEmail = (email || 'user@friendoo.in').trim();
    const customerPhone = (phone || '9999999999').trim();

    const udf1 = userId || '';
    const udf2 = String(pkg.coins);
    const udf3 = '';
    const udf4 = '';
    const udf5 = '';

    // 3. Compute SHA-512 Hash
    // sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt)
    const hashString = `${PAYU_KEY}|${txnid}|${amount}|${productinfo}|${customerName}|${customerEmail}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${PAYU_SALT}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    // 4. Record pending payment order
    if (userId) {
      await supabase.from('payment_orders').insert({
        user_id: userId,
        package_id: pkg.id,
        amount_inr: pkg.amount_inr,
        coins: pkg.coins,
        provider: 'payu',
        provider_order_id: txnid,
        status: 'pending',
      });
    }

    const surl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://friendoo.in'}/api/payments/payu/webhook`;
    const furl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://friendoo.in'}/api/payments/payu/webhook`;

    return NextResponse.json({
      actionUrl: PAYU_ACTION_URL,
      params: {
        key: PAYU_KEY,
        txnid,
        amount,
        productinfo,
        firstname: customerName,
        email: customerEmail,
        phone: customerPhone,
        surl,
        furl,
        hash,
        udf1,
        udf2,
        udf3,
        udf4,
        udf5,
      },
    });
  } catch (err: unknown) {
    console.error('PayU Create Order Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
