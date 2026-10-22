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

async function resolveCashfreeConfig(admin: any) {
  let docSettings: Record<string, unknown> = {};
  try {
    const { data } = await admin
      .from('crm_configuration_documents')
      .select('payload')
      .eq('id', 'payout_settings')
      .maybeSingle();
    if (data?.payload && typeof data.payload === 'object') {
      docSettings = data.payload as Record<string, unknown>;
    }
  } catch (_) {}

  const envVar = Deno.env.get('CASHFREE_ENVIRONMENT') || String(docSettings.environment || 'sandbox');
  const prodAppId = Deno.env.get('CASHFREE_APP_ID') || String(docSettings.pg_app_id || '');
  const prodSecret = Deno.env.get('CASHFREE_SECRET_KEY') || String(docSettings.pg_secret_key || '');
  const sandAppId = Deno.env.get('CASHFREE_SANDBOX_APP_ID') || String(docSettings.pg_app_id || '');
  const sandSecret = Deno.env.get('CASHFREE_SANDBOX_SECRET_KEY') || String(docSettings.pg_secret_key || '');

  const isProduction = envVar === 'production' && Boolean(prodAppId && prodSecret);
  const environment = isProduction ? 'production' : 'sandbox';
  const appId = isProduction ? prodAppId : (sandAppId || prodAppId);
  const secret = isProduction ? prodSecret : (sandSecret || prodSecret);
  const isTestMode = docSettings.test === true || !appId || !secret;

  return {
    environment,
    baseUrl: isProduction
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg',
    appId,
    secret,
    isTestMode,
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
  return typeof value === 'string' && /^cf_order_[A-Za-z0-9_]{10,64}$/.test(value);
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

    const config = await resolveCashfreeConfig(admin);

    // If test mode or Cashfree credentials are empty, settle authoritatively
    if (config.isTestMode || !config.appId || !config.secret) {
      const {error: testCreditError} = await admin.rpc('credit_friendoo_payment', {
        p_provider_order_id: providerOrderId,
        p_payment_id: `test_pay_${Date.now()}`,
        p_payment_method: 'sandbox_test',
      });
      if (testCreditError) {
        console.error('Test payment credit failed', testCreditError);
        return error('Unable to settle test payment', 500, responseHeaders);
      }
      await recordSecurityEvent(admin, {
        eventType: 'cashfree.confirm.accepted',
        outcome: 'accepted',
        actorId: user.id,
        targetType: 'payment_order',
        targetId: order.id,
        metadata: {environment: 'sandbox', test_mode: true},
      });
      return json({paid: true, settled: true, is_test_mode: true}, 200, responseHeaders);
    }

    const headers = providerHeaders(config.appId, config.secret);

    let activeBaseUrl = config.baseUrl;
    let providerResponse = await fetch(
      `${activeBaseUrl}/orders/${encodeURIComponent(providerOrderId)}`,
      {headers},
    );
    if (providerResponse.status === 401) {
      const alternateBaseUrl = activeBaseUrl.includes('sandbox')
        ? 'https://api.cashfree.com/pg'
        : 'https://sandbox.cashfree.com/pg';
      const retryResponse = await fetch(
        `${alternateBaseUrl}/orders/${encodeURIComponent(providerOrderId)}`,
        {headers},
      );
      if (retryResponse.ok || retryResponse.status !== 401) {
        providerResponse = retryResponse;
        activeBaseUrl = alternateBaseUrl;
      }
    }
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
      `${activeBaseUrl}/orders/${encodeURIComponent(providerOrderId)}/payments`,
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