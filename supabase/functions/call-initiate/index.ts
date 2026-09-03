import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {
  allowedCorsHeaders,
  authenticatedUser,
  error,
  json,
  readJsonBody,
  serviceClient,
} from '../_shared/http.ts';

type CallInitiateRequest = {
  host_id?: unknown;
  call_type?: unknown;
};

Deno.serve(async (request) => {
  const responseHeaders = allowedCorsHeaders(request);
  if (request.method === 'OPTIONS') {
    return new Response('ok', {headers: responseHeaders});
  }
  if (request.method !== 'POST') {
    return error('Method not allowed', 405, responseHeaders);
  }

  try {
    const user = await authenticatedUser(request);
    if (!user) return error('Unauthorized', 401, responseHeaders);

    const body = await readJsonBody<CallInitiateRequest>(request);
    const hostId = typeof body.host_id === 'string' ? body.host_id : '';
    const callType = body.call_type === 'video' ? 'video' : 'audio';
    if (!hostId) return error('host_id is required', 400, responseHeaders);

    const channel = `friendoo_${crypto.randomUUID().replaceAll('-', '')}`;
    const admin = serviceClient();
    const {data, error: rpcError} = await admin.rpc('create_friendoo_call', {
      p_caller_id: user.id,
      p_host_id: hostId,
      p_call_type: callType,
      p_rtc_channel: channel,
    });
    if (rpcError) return error('Unable to create the call', 409, responseHeaders);

    return json({call: data}, 200, responseHeaders);
  } catch (caught) {
    console.error('call-initiate failed', caught);
    const status = caught instanceof Error && caught.message === 'REQUEST_BODY_TOO_LARGE'
      ? 413
      : caught instanceof Error && caught.message === 'INVALID_JSON_BODY'
      ? 400
      : 500;
    return error(status === 413 ? 'Request body is too large' : 'Unable to create the call', status, responseHeaders);
  }
});
