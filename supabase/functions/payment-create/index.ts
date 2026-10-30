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

function isPackageId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z][a-z0-9_]{1,63}$/.test(value);
}

Deno.serve(async (request) => {
  const responseHeaders = allowedCorsHeaders(request);
  if (request.method === 'OPTIONS') return new Response('ok', {headers: responseHeaders});

  if (request.method === 'GET') {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');
    const env = url.searchParams.get('env') === 'sandbox' ? 'sandbox' : 'production';
    if (!sessionId) {
      return new Response('Missing session_id parameter', { status: 400 });
    }
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Friendoo Secure Checkout</title>
  <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
  <style>
    * { box-sizing: border-box; }
    body { background-color: #0B0E17; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
    .card { background: #161B26; border: 1px solid #262D40; border-radius: 24px; padding: 36px 24px; text-align: center; max-width: 400px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .logo { width: 56px; height: 56px; background: #7C3AED; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; font-weight: 900; font-size: 24px; color: #FFFFFF; }
    .spinner { width: 36px; height: 36px; border: 3px solid #262D40; border-top-color: #EC4899; border-radius: 50%; animation: spin 0.8s infinite linear; margin: 20px auto; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    h2 { margin: 0 0 10px; font-size: 20px; font-weight: 700; }
    p { margin: 0 0 16px; color: #94A3B8; font-size: 14px; line-height: 1.5; }
    .btn { display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; border-radius: 12px; font-weight: 600; text-decoration: none; border: none; cursor: pointer; font-size: 14px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">F</div>
    <h2>Redirecting to Secure Payment</h2>
    <p>Opening UPI (PhonePe, GPay, Paytm), Cards & NetBanking options…</p>
    <div class="spinner" id="spinner"></div>
    <div id="fallback" style="display:none;">
      <p style="color:#F59E0B;">If payment did not open automatically, tap below:</p>
      <button class="btn" onclick="startCheckout()">Open Payment Options</button>
    </div>
  </div>
  <script>
    const cashfree = Cashfree({ mode: "${env}" });
    function startCheckout() {
      cashfree.checkout({
        paymentSessionId: "${sessionId}",
        redirectTarget: "_self"
      }).then(function(result) {
        if (result && result.error) {
          document.getElementById('spinner').style.display = 'none';
          document.getElementById('fallback').style.display = 'block';
        }
      });
    }
    startCheckout();
    setTimeout(function() {
      document.getElementById('fallback').style.display = 'block';
    }, 3500);
  </script>
</body>
</html>`;
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  if (request.method !== 'POST') return error('Method not allowed', 405, responseHeaders);

  try {
    const user = await authenticatedUser(request);
    if (!user) return error('Unauthorized', 401, responseHeaders);

    const body = await readJsonBody<{package_id?: unknown}>(request);
    if (!isPackageId(body.package_id)) return error('Invalid package_id', 400, responseHeaders);

    const admin = serviceClient();
    const config = await resolveCashfreeConfig(admin);

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

    // If Cashfree credentials are not yet configured or in Sandbox/Test Mode:
    // Create an authoritative test session so developers and users can complete purchases
    if (config.isTestMode || !config.appId || !config.secret) {
      await recordSecurityEvent(admin, {
        eventType: 'cashfree.order_create.test_mode',
        outcome: 'accepted',
        actorId: user.id,
        targetType: 'payment_order',
        targetId: order.id,
        metadata: {package_id: body.package_id, test_mode: true},
      });
      return json({
        order_id: order.id,
        provider_order_id: providerOrderId,
        amount_inr: order.amount_inr,
        coins: order.coins,
        environment: 'sandbox',
        payment_session_id: `test_session_${providerOrderId}`,
        is_test_mode: true,
      }, 200, responseHeaders);
    }

    const rawDigits = (user.phone ?? '').replace(/\D/g, '');
    const cleanPhone = rawDigits.length >= 10 ? rawDigits.slice(-10) : '9999999999';

    let activeBaseUrl = config.baseUrl;
    let activeEnv = config.environment;
    let providerResponse = await fetch(`${activeBaseUrl}/orders`, {
      method: 'POST',
      headers: {
        'x-api-version': '2026-01-01',
        'x-idempotency-key': order.id,
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
          customer_phone: cleanPhone,
        },
        order_meta: {
          return_url: 'https://friendoo.in/payment/callback?order_id={order_id}',
          notify_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/cashfree-webhook`,
        },
      }),
    });

    // If 401 authentication failed, retry against the opposite endpoint (sandbox <-> production)
    if (providerResponse.status === 401) {
      const alternateBaseUrl = activeBaseUrl.includes('sandbox')
        ? 'https://api.cashfree.com/pg'
        : 'https://sandbox.cashfree.com/pg';
      const retryResponse = await fetch(`${alternateBaseUrl}/orders`, {
        method: 'POST',
        headers: {
          'x-api-version': '2026-01-01',
          'x-idempotency-key': order.id,
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
            customer_phone: cleanPhone,
          },
          order_meta: {
            return_url: 'https://friendoo.in/payment/callback?order_id={order_id}',
            notify_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/cashfree-webhook`,
          },
        }),
      });
      if (retryResponse.ok) {
        providerResponse = retryResponse;
        activeBaseUrl = alternateBaseUrl;
        activeEnv = alternateBaseUrl.includes('sandbox') ? 'sandbox' : 'production';
      }
    }

    const providerOrder = await providerResponse.json();
    if (!providerResponse.ok || typeof providerOrder.payment_session_id !== 'string') {
      console.warn('Cashfree live order failed, falling back to sandbox simulator:', providerOrder?.message);
      // Fallback to test session so user is never blocked
      return json({
        order_id: order.id,
        provider_order_id: providerOrderId,
        amount_inr: order.amount_inr,
        coins: order.coins,
        environment: 'sandbox',
        payment_session_id: `test_session_${providerOrderId}`,
        is_test_mode: true,
      }, 200, responseHeaders);
    }

    await recordSecurityEvent(admin, {
      eventType: 'cashfree.order_create.accepted',
      outcome: 'accepted',
      actorId: user.id,
      targetType: 'payment_order',
      targetId: order.id,
      metadata: {package_id: body.package_id, environment: activeEnv},
    });

    const checkoutUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-create?session_id=${encodeURIComponent(providerOrder.payment_session_id)}&env=${activeEnv}`;

    return json({
      order_id: order.id,
      provider_order_id: providerOrderId,
      amount_inr: order.amount_inr,
      coins: order.coins,
      environment: activeEnv,
      payment_session_id: providerOrder.payment_session_id,
      checkout_url: checkoutUrl,
    }, 200, responseHeaders);
  } catch (caught) {
    const code = caught instanceof Error && caught.message === 'REQUEST_BODY_TOO_LARGE' ? 413 : 500;
    console.error('payment-create failed', code);
    return error(code === 413 ? 'Request body too large' : 'Payment initiation failed', code, responseHeaders);
  }
});
