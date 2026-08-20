import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {corsHeaders, authenticatedUser, error, json, serviceClient} from '../_shared/http.ts';

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', {headers: corsHeaders});
  if (request.method !== 'POST') return error('Method not allowed', 405);

  try {
    const user = await authenticatedUser(request);
    if (!user) return error('Unauthorized', 401);

    const body = await request.json();
    const hostId = typeof body.host_id === 'string' ? body.host_id : '';
    const callType = body.call_type === 'video' ? 'video' : 'audio';
    if (!hostId) return error('host_id is required');

    const channel = `friendoo_${crypto.randomUUID().replaceAll('-', '')}`;
    const admin = serviceClient();
    const {data, error: rpcError} = await admin.rpc('create_friendoo_call', {
      p_caller_id: user.id,
      p_host_id: hostId,
      p_call_type: callType,
      p_rtc_channel: channel,
    });
    if (rpcError) return error(rpcError.message, 409);

    return json({call: data});
  } catch (caught) {
    console.error('call-initiate failed', caught);
    return error('Unable to initiate the call', 500);
  }
});
