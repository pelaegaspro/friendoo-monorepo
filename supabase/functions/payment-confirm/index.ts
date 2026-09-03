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

type LocalPaymentOrder = {
  id: string;
  user_id: string;
  provider_order_id: string;
  amount_inr: number;
  status: string;
};

type CashfreeOrder = {
  order_id?: string;
  order_status?: string;
  order_amount?: number;
  order_currency?: string;
  customer_details?: {customer_id?: string};
};

type CashfreePayment = {
  cf_payment_id?: string | number;
  payment_status?: string;
  payment_group?: string;
};

function cashfreeConfig() {
  const environment = Deno.env.get('CASHFREE_ENVIRONMENT') === 'production'
    ? 'production'
    : 'sandbox';
  return {
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

function providerHeaders(appId: string, secret: string) {
  return {
    accept: 'application/json',
    'x-api-version': '2026-01-01',
    'x-client-id': appId,
    'x-client-secret': secret,
  };
}

function isProviderOrderId(value: unknown): value is string {
  return typeof value === 'string' && /^cf_order_[A-Za-z0-9]{32}$/.test(value);
}

Deno.serve(async (request) => {
  const responseHeaders = allowedCorsHeaders(request);
  if (request.method === 'OPTIONS') return new Response('ok', {headers: responseHeaders});
  if (request.method !== 'POST') return error('Method not allowed', 405, responseHeaders);

  try {
    const user = await authenticatedUser(request);
    if (!user) return error('Unauthorized', 401, responseHeaders);

    const body = await readJsonBody<{provider_order_id?: unknown}>(request);
    if (!isProviderOrderId(body.provider_order_id)) return error('Invalid provider_order_id', 400, responseHeaders);
    const providerOrderId = body.provider_order_id;

    const admin = serviceClient();
    const {data: rawOrder, error: orderError} = await admin
      .from('payment_orders')
      .select('id, user_id, provider_order_id, amount_inr, status')
      .eq('provider_order_id', providerOrderId)
      .eq('user_id', user.id)
      .single();
    const order = rawOrder as LocalPaymentOrder | null;
    if (orderError || !order) return error('Payment order not found', 404, responseHeaders);

    if (order.status === 'success') {
      await recordSecurityEvent(admin, {
        eventType: 'cashfree.confirm.duplicate',
        outcome: 'duplicate',
        actorId: user.id,
        targetType: 'payment_order',
        targetId: order.id,
      });
      return json({paid: true, settled: true}, 200, responseHeaders);
    }

    const config = cashfreeConfig();
    if (!config.appId || !config.secret) return error('Cashfree is not configured', 503, responseHeaders);
    const headers = providerHeaders(config.appId, config.secret);

    const providerResponse = await fetch(
      `${config.baseUrl}/orders/${encodeURIComponent(providerOrderId)}`,
      {headers},
    );
    const providerOrder = await providerResponse.json() as CashfreeOrder;
    if (!providerResponse.ok) {
      console.error('Cashfree order verification failed', providerResponse.status);
      await recordSecurityEvent(admin, {
        eventType: 'cashfree.confirm.failed',
        outcome: 'failed',
        actorId: user.id,
        targetType: 'payment_order',
        targetId: order.id,
      });
      return error('Unable to verify Cashfree payment order', 502, responseHeaders);
    }

    if (
      providerOrder.order_id !== providerOrderId ||
      providerOrder.order_status !== 'PAID' ||
      Number(providerOrder.order_amount) !== order.amount_inr ||
      providerOrder.order_currency !== 'INR' ||
      providerOrder.customer_details?.customer_id !== user.id
    ) {
      await recordSecurityEvent(admin, {
        eventType: 'cashfree.confirm.rejected',
        outcome: 'rejected',
        actorId: user.id,
        targetType: 'payment_order',
        targetId: order.id,
      });
      return json({paid: false, settled: false}, 200, responseHeaders);
    }

    const paymentsResponse = await fetch(
      `${config.baseUrl}/orders/${encodeURIComponent(providerOrderId)}/payments`,
      {headers},
    );
    const payments = await paymentsResponse.json() as CashfreePayment[];
    if (!paymentsResponse.ok || !Array.isArray(payments)) {
      console.error('Cashfree payment lookup failed', paymentsResponse.status);
      return error('Unable to verify Cashfree payment details', 502, responseHeaders);
    }

    const successfulPayment = payments.find(
      (payment) => payment.payment_status === 'SUCCESS' && payment.cf_payment_id != null,
    );
    if (!successfulPayment) return json({paid: false, settled: false}, 200, responseHeaders);

    const {error: creditError} = await admin.rpc('credit_friendoo_payment', {
      p_provider_order_id: providerOrderId,
      p_payment_id: String(successfulPayment.cf_payment_id),
      p_payment_method: typeof successfulPayment.payment_group === 'string'
        ? successfulPayment.payment_group.slice(0, 64)
        : 'unknown',
    });
    if (creditError) {
      console.error('Cashfree payment credit failed', creditError.code);
      await recordSecurityEvent(admin, {
        eventType: 'cashfree.confirm.failed',
        outcome: 'failed',
        actorId: user.id,
        targetType: 'payment_order',
        targetId: order.id,
      });
      return error('Unable to settle Cashfree payment', 500, responseHeaders);
    }

    await recordSecurityEvent(admin, {
      eventType: 'cashfree.confirm.accepted',
      outcome: 'accepted',
      actorId: user.id,
      targetType: 'payment_order',
      targetId: order.id,
      metadata: {environment: config.baseUrl.includes('sandbox') ? 'sandbox' : 'production'},
    });
    return json({paid: true, settled: true}, 200, responseHeaders);
  } catch (caught) {
    const code = caught instanceof Error && caught.message === 'REQUEST_BODY_TOO_LARGE' ? 413 : 500;
    console.error('payment-confirm failed', code);
    return error(code === 413 ? 'Request body too large' : 'Payment confirmation failed', code, responseHeaders);
  }
});
