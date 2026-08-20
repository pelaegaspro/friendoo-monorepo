import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {corsHeaders, authenticatedUser, error, json, serviceClient} from '../_shared/http.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', {headers: corsHeaders});
  if (request.method !== 'POST') return error('Method not allowed', 405);

  try {
    const user = await authenticatedUser(request);
    if (!user) return error('Unauthorized', 401);

    const body = await request.json();
    const callId = typeof body.call_id === 'string' ? body.call_id : '';
    const reason = typeof body.reason === 'string' ? body.reason : 'user_hangup';
    if (!callId) return error('call_id is required');

    const admin = serviceClient();
    const {data, error: rpcError} = await admin.rpc('end_friendoo_call', {
      p_call_id: callId,
      p_actor_id: user.id,
      p_reason: reason,
    });
    if (rpcError) return error(rpcError.message, 409);

    return json({call: data});
  } catch (caught) {
    console.error('call-end failed', caught);
    return error('Unable to end the call', 500);
  }
});
