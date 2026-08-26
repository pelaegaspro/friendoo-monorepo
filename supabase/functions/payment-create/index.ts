import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {corsHeaders, authenticatedUser, error, json, serviceClient} from '../_shared/http.ts';

type PaymentOrder = {
  id: string;
  amount_inr: number;
  coins: number;
};

function cashfreeConfig() {
  const environment = Deno.env.get('CASHFREE_ENVIRONMENT') === 'production'
    ? 'production'
    : 'sandbox';
  return {
    environment,
    baseUrl: environment === 'production'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg',
    appId: Deno.env.get(
      environment === 'production' ? 'CASHFREE_APP_ID' : 'CASHFREE_SANDBOX_APP_ID',
    ),
    secret: Deno.env.get(
      environment === 'production' ? 'CASHFREE_SECRET_KEY' : 'CASHFREE_SANDBOX_SECRET_KEY',
    ),
  };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', {headers: corsHeaders});
  if (request.method !== 'POST') return error('Method not allowed', 405);

  try {
    const user = await authenticatedUser(request);
    if (!user) return error('Unauthorized', 401);

    const body = await request.json();
    const packageId = typeof body.package_id === 'string' ? body.package_id : '';
    if (!packageId) return error('package_id is required');

    const config = cashfreeConfig();
    if (!config.appId || !config.secret) return error('Cashfree is not configured', 503);

    const admin = serviceClient();
    const providerOrderId = `cf_order_${crypto.randomUUID().replaceAll('-', '')}`;

    // Record the pending purchase first. The database fetches the active package
    // and sets the only price/coin quantity that can later be credited.
    const {data: rawOrder, error: orderError} = await admin.rpc(
      'create_friendoo_pending_payment',
      {
        p_user_id: user.id,
        p_package_id: packageId,
        p_provider_order_id: providerOrderId,
      },
    );
    const order = rawOrder as PaymentOrder | null;
    if (orderError || !order) {
      console.error('Failed to create payment order', orderError);
      return error('Unable to initiate payment order', 500);
    }

    const providerResponse = await fetch(`${config.baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'x-api-version': '2023-08-01',
        'x-client-id': config.appId,
        'x-client-secret': config.secret,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        order_id: providerOrderId,
        order_amount: order.amount_inr,
        order_currency: 'INR',
        customer_details: {
          customer_id: user.id,
          customer_email: user.email ?? 'noreply@friendoo.in',
          customer_phone: user.phone ?? '9999999999',
        },
        order_meta: {
          return_url: 'https://friendoo.in/payment/callback?order_id={order_id}',
          notify_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/cashfree-webhook`,
        },
      }),
    });
    const providerOrder = await providerResponse.json();
    if (!providerResponse.ok || !providerOrder.payment_session_id) {
      console.error('Cashfree order creation failed', providerOrder);
      await admin
        .from('payment_orders')
        .update({status: 'failed'})
        .eq('id', order.id)
        .eq('status', 'pending');
      return error('Unable to create Cashfree payment order', 502);
    }

    return json({
      order_id: order.id,
      provider_order_id: providerOrderId,
      amount_inr: order.amount_inr,
      coins: order.coins,
      environment: config.environment,
      payment_session_id: providerOrder.payment_session_id,
    });
  } catch (caught) {
    console.error('payment-create failed', caught);
    return error('Payment initiation failed', 500);
  }
});
