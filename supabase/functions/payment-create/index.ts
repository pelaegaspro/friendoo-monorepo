import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {
  allowedCorsHeaders,
  authenticatedUser,
  error,
  json,
  readJsonBody,
  recordSecurityEvent,
  serviceClient,
} from '../_shared/http.ts';

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
    appId: environment === 'production'
      ? Deno.env.get('CASHFREE_APP_ID')
      : Deno.env.get('CASHFREE_SANDBOX_APP_ID') ?? Deno.env.get('CASHFREE_APP_ID'),
    secret: environment === 'production'
      ? Deno.env.get('CASHFREE_SECRET_KEY')
      : Deno.env.get('CASHFREE_SANDBOX_SECRET_KEY') ?? Deno.env.get('CASHFREE_SECRET_KEY'),
  };
}

function isPackageId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z][a-z0-9_]{1,63}$/.test(value);
}

Deno.serve(async (request) => {
  const responseHeaders = allowedCorsHeaders(request);
  if (request.method === 'OPTIONS') return new Response('ok', {headers: responseHeaders});
  if (request.method !== 'POST') return error('Method not allowed', 405, responseHeaders);

  try {
    const user = await authenticatedUser(request);
    if (!user) return error('Unauthorized', 401, responseHeaders);

    const body = await readJsonBody<{package_id?: unknown}>(request);
    if (!isPackageId(body.package_id)) return error('Invalid package_id', 400, responseHeaders);

    const config = cashfreeConfig();
    if (!config.appId || !config.secret) return error('Cashfree is not configured', 503, responseHeaders);

    const admin = serviceClient();
    const providerOrderId = `cf_order_${crypto.randomUUID().replaceAll('-', '')}`;

    // The database resolves the active package and is the sole source of price and coin quantity.
    const {data: rawOrder, error: orderError} = await admin.rpc(
      'create_friendoo_pending_payment',
      {
        p_user_id: user.id,
        p_package_id: body.package_id,
        p_provider_order_id: providerOrderId,
      },
    );
    const order = rawOrder as PaymentOrder | null;
    if (orderError || !order) {
      console.error('payment-create database reservation failed', orderError?.code);
      await recordSecurityEvent(admin, {
        eventType: 'cashfree.order_create.failed',
        outcome: 'failed',
        actorId: user.id,
        targetType: 'coin_package',
        targetId: body.package_id,
      });
      return error('Unable to initiate payment order', 500, responseHeaders);
    }

    const rawDigits = (user.phone ?? '').replace(/\D/g, '');
    const cleanPhone = rawDigits.length >= 10 ? rawDigits.slice(-10) : '9999999999';

    const providerResponse = await fetch(`${config.baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'x-api-version': '2026-01-01',
        'x-client-id': config.appId,
        'x-client-secret': config.secret,
        'x-idempotency-key': order.id,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        order_id: providerOrderId,
        order_amount: order.amount_inr,
        order_currency: 'INR',
        customer_details: {
          customer_id: user.id,
          customer_email: user.email ?? 'noreply@friendoo.in',
          customer_phone: cleanPhone,
        },
        order_meta: {
          return_url: 'https://friendoo.in/payment/callback?order_id={order_id}',
          notify_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/cashfree-webhook`,
        },
      }),
    });
    const providerOrder = await providerResponse.json();
    if (!providerResponse.ok || typeof providerOrder.payment_session_id !== 'string') {
      console.error('Cashfree order creation failed', providerResponse.status, providerOrder?.type ?? 'unknown', providerOrder?.message ?? '');
      await admin
        .from('payment_orders')
        .update({status: 'failed'})
        .eq('id', order.id)
        .eq('status', 'pending');
      await recordSecurityEvent(admin, {
        eventType: 'cashfree.order_create.failed',
        outcome: 'failed',
        actorId: user.id,
        targetType: 'payment_order',
        targetId: order.id,
      });
      return error('Unable to create Cashfree payment order', 502, responseHeaders);
    }

    await recordSecurityEvent(admin, {
      eventType: 'cashfree.order_create.accepted',
      outcome: 'accepted',
      actorId: user.id,
      targetType: 'payment_order',
      targetId: order.id,
      metadata: {package_id: body.package_id, environment: config.environment},
    });
    return json({
      order_id: order.id,
      provider_order_id: providerOrderId,
      amount_inr: order.amount_inr,
      coins: order.coins,
      environment: config.environment,
      payment_session_id: providerOrder.payment_session_id,
    }, 200, responseHeaders);
  } catch (caught) {
    const code = caught instanceof Error && caught.message === 'REQUEST_BODY_TOO_LARGE' ? 413 : 500;
    console.error('payment-create failed', code);
    return error(code === 413 ? 'Request body too large' : 'Payment initiation failed', code, responseHeaders);
  }
});
