import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {corsHeaders, authenticatedUser, error, json, serviceClient} from '../_shared/http.ts';

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
    appId: Deno.env.get(
      environment === 'production' ? 'CASHFREE_APP_ID' : 'CASHFREE_SANDBOX_APP_ID',
    ),
    secret: Deno.env.get(
      environment === 'production' ? 'CASHFREE_SECRET_KEY' : 'CASHFREE_SANDBOX_SECRET_KEY',
    ),
  };
}

function providerHeaders(appId: string, secret: string) {
  return {
    accept: 'application/json',
    'x-api-version': '2023-08-01',
    'x-client-id': appId,
    'x-client-secret': secret,
  };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', {headers: corsHeaders});
  if (request.method !== 'POST') return error('Method not allowed', 405);

  try {
    const user = await authenticatedUser(request);
    if (!user) return error('Unauthorized', 401);

    const body = await request.json();
    const providerOrderId = typeof body.provider_order_id === 'string'
      ? body.provider_order_id
      : '';
    if (!providerOrderId) return error('provider_order_id is required');

    const admin = serviceClient();
    const {data: rawOrder, error: orderError} = await admin
      .from('payment_orders')
      .select('id, user_id, provider_order_id, amount_inr, status')
      .eq('provider_order_id', providerOrderId)
      .eq('user_id', user.id)
      .single();
    const order = rawOrder as LocalPaymentOrder | null;
    if (orderError || !order) return error('Payment order not found', 404);

    // A duplicate confirmation of a previously settled order is safe and does
    // not require another provider request or ledger change.
    if (order.status === 'success') {
      return json({paid: true, settled: true});
    }

    const config = cashfreeConfig();
    if (!config.appId || !config.secret) return error('Cashfree is not configured', 503);
    const headers = providerHeaders(config.appId, config.secret);

    const providerResponse = await fetch(
      `${config.baseUrl}/orders/${encodeURIComponent(providerOrderId)}`,
      {headers},
    );
    const providerOrder = await providerResponse.json() as CashfreeOrder;
    if (!providerResponse.ok) {
      console.error('Cashfree order verification failed', providerOrder);
      return error('Unable to verify Cashfree payment order', 502);
    }

    // Never settle based on the redirect alone. Every provider-side identity,
    // amount, currency, and paid status must agree with the local order.
    if (
      providerOrder.order_id !== providerOrderId ||
      providerOrder.order_status !== 'PAID' ||
      Number(providerOrder.order_amount) !== order.amount_inr ||
      providerOrder.order_currency !== 'INR' ||
      providerOrder.customer_details?.customer_id !== user.id
    ) {
      return json({paid: false, settled: false});
    }

    const paymentsResponse = await fetch(
      `${config.baseUrl}/orders/${encodeURIComponent(providerOrderId)}/payments`,
      {headers},
    );
    const payments = await paymentsResponse.json() as CashfreePayment[];
    if (!paymentsResponse.ok || !Array.isArray(payments)) {
      console.error('Cashfree payment lookup failed', payments);
      return error('Unable to verify Cashfree payment details', 502);
    }

    const successfulPayment = payments.find(
      (payment) => payment.payment_status === 'SUCCESS' && payment.cf_payment_id != null,
    );
    if (!successfulPayment) return json({paid: false, settled: false});

    const {error: creditError} = await admin.rpc('credit_friendoo_payment', {
      p_provider_order_id: providerOrderId,
      p_payment_id: String(successfulPayment.cf_payment_id),
      p_payment_method: successfulPayment.payment_group ?? 'unknown',
    });
    if (creditError) {
      console.error('Cashfree payment credit failed', creditError);
      return error('Unable to settle Cashfree payment', 500);
    }

    return json({paid: true, settled: true});
  } catch (caught) {
    console.error('payment-confirm failed', caught);
    return error('Payment confirmation failed', 500);
  }
});
