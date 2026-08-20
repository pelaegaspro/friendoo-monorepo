import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {corsHeaders, error, json, serviceClient} from '../_shared/http.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', {headers: corsHeaders});
  if (request.method !== 'POST') return error('Method not allowed', 405);

  const cronSecret = Deno.env.get('BILLING_CRON_SECRET');
  if (!cronSecret || request.headers.get('x-friendoo-cron-secret') !== cronSecret) {
    return error('Unauthorized', 401);
  }

  try {
    const admin = serviceClient();
    const [billingRes, reaperRes] = await Promise.all([
      admin.rpc('bill_active_friendoo_calls'),
      admin.rpc('reap_stale_friendoo_calls'),
    ]);
    if (billingRes.error) return error(billingRes.error.message, 500);
    if (reaperRes.error) console.error('reaper error:', reaperRes.error.message);

    return json({
      billed_calls: billingRes.data ?? 0,
      reaped_calls: reaperRes.data ?? 0,
    });
  } catch (caught) {
    console.error('call-billing failed', caught);
    return error('Unable to bill calls', 500);
  }
});
