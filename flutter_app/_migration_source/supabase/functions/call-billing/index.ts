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
    const {data, error: rpcError} = await admin.rpc('bill_active_friendoo_calls');
    if (rpcError) return error(rpcError.message, 500);
    return json({billed_calls: data});
  } catch (caught) {
    console.error('call-billing failed', caught);
    return error('Unable to bill calls', 500);
  }
});
