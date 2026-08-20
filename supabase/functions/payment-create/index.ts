import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {corsHeaders, authenticatedUser, error, json, serviceClient} from '../_shared/http.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', {headers: corsHeaders});
  if (request.method !== 'POST') return error('Method not allowed', 405);

  try {
    const user = await authenticatedUser(request);
    if (!user) return error('Unauthorized', 401);

    const body = await request.json();
    const packageId = typeof body.package_id === 'string' ? body.package_id : '';
    if (!packageId) return error('package_id is required');

    const admin = serviceClient();

    // 1. Fetch authoritative package price from database
    const {data: pkg, error: pkgError} = await admin
      .from('coin_packages')
      .select('id, coins, amount_inr, is_active')
      .eq('id', packageId)
      .eq('is_active', true)
      .single();

    if (pkgError || !pkg) {
      return error('Invalid or inactive coin package', 404);
    }

    // 2. Check first-time buyer bonus server-side (do NOT trust client)
    const {data: previousOrders} = await admin
      .from('payment_orders')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'success')
      .limit(1);

    const isFirstTime = !previousOrders || previousOrders.length === 0;
    const finalCoins = isFirstTime ? Math.round(pkg.coins * 1.5) : pkg.coins;

    const providerOrderId = `cf_order_${crypto.randomUUID().replaceAll('-', '')}`;

    // 3. Create server-authoritative payment order record
    const {data: order, error: orderError} = await admin
      .from('payment_orders')
      .insert({
        user_id: user.id,
        package_id: pkg.id,
        amount_inr: pkg.amount_inr,
        coins: finalCoins,
        provider: 'cashfree',
        provider_order_id: providerOrderId,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Failed to create payment order', orderError);
      return error('Unable to initiate payment order', 500);
    }

    return json({
      order_id: order.id,
      provider_order_id: providerOrderId,
      amount_inr: pkg.amount_inr,
      coins: finalCoins,
      is_first_time_buyer: isFirstTime,
      environment: Deno.env.get('CASHFREE_ENVIRONMENT') ?? 'sandbox',
    });
  } catch (caught) {
    console.error('payment-create failed', caught);
    return error('Payment initiation failed', 500);
  }
});
