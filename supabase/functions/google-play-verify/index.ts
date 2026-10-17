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

type GooglePlayVerifyPayload = {
  product_id?: unknown;
  package_id?: unknown;
  order_id?: unknown;
  purchase_token?: unknown;
  amount_inr?: unknown;
  coins?: unknown;
};

Deno.serve(async (request) => {
  const responseHeaders = allowedCorsHeaders(request);
  if (request.method === 'OPTIONS') return new Response('ok', { headers: responseHeaders });
  if (request.method !== 'POST') return error('Method not allowed', 405, responseHeaders);

  try {
    const user = await authenticatedUser(request);
    if (!user) return error('Unauthorized', 401, responseHeaders);

    const body = await readJsonBody<GooglePlayVerifyPayload>(request);
    const productId = typeof body.product_id === 'string' ? body.product_id.trim() : null;
    const packageId = typeof body.package_id === 'string' ? body.package_id.trim() : (productId ?? '');
    const orderId = typeof body.order_id === 'string' ? body.order_id.trim() : '';
    const purchaseToken = typeof body.purchase_token === 'string' ? body.purchase_token.trim() : '';

    if (!purchaseToken) {
      return error('purchase_token is required', 400, responseHeaders);
    }
    if (!packageId && !productId) {
      return error('product_id or package_id is required', 400, responseHeaders);
    }

    const admin = serviceClient();

    // Call atomic database credit procedure
    const { data, error: rpcError } = await admin.rpc('credit_google_play_purchase', {
      p_user_id: user.id,
      p_package_id: packageId || productId,
      p_order_id: orderId,
      p_purchase_token: purchaseToken,
      p_amount_inr: typeof body.amount_inr === 'number' ? body.amount_inr : null,
      p_coins: typeof body.coins === 'number' ? body.coins : null,
    });

    if (rpcError) {
      console.error('Google Play purchase crediting error:', rpcError);
      await recordSecurityEvent(admin, {
        eventType: 'google_play.verify.failed',
        outcome: 'failed',
        actorId: user.id,
        targetType: 'google_play_purchase',
        metadata: { error: rpcError.message, productId, orderId },
      });
      return error('Unable to credit Google Play purchase', 500, responseHeaders);
    }

    await recordSecurityEvent(admin, {
      eventType: 'google_play.verify.success',
      outcome: 'accepted',
      actorId: user.id,
      targetType: 'google_play_purchase',
      metadata: { productId, orderId, result: data },
    });

    return json(data ?? { success: true }, 200, responseHeaders);
  } catch (caught) {
    const code = caught instanceof Error && caught.message === 'REQUEST_BODY_TOO_LARGE' ? 413 : 500;
    console.error('google-play-verify error', caught);
    return error(code === 413 ? 'Request body too large' : 'Verification failed', code, responseHeaders);
  }
});

