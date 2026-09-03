import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {
  allowedCorsHeaders,
  authenticatedUser,
  error,
  json,
  readJsonBody,
  serviceClient,
} from '../_shared/http.ts';

type CallAcceptRequest = {
  call_id?: unknown;
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

    const body = await readJsonBody<CallAcceptRequest>(request);
    const callId = typeof body.call_id === 'string' ? body.call_id : '';
    if (!callId) return error('call_id is required', 400, responseHeaders);

    const admin = serviceClient();
    const {data, error: rpcError} = await admin.rpc('accept_friendoo_call', {
      p_call_id: callId,
      p_host_id: user.id,
    });
    if (rpcError) return error('Unable to accept the call', 409, responseHeaders);

    return json({call: data}, 200, responseHeaders);
  } catch (caught) {
    console.error('call-accept failed', caught);
    const status = caught instanceof Error && caught.message === 'REQUEST_BODY_TOO_LARGE'
      ? 413
      : caught instanceof Error && caught.message === 'INVALID_JSON_BODY'
      ? 400
      : 500;
    return error(status === 413 ? 'Request body is too large' : 'Unable to accept the call', status, responseHeaders);
  }
});
