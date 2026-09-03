import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {RtcRole, RtcTokenBuilder} from 'npm:agora-token@2.0.3';

import {
  allowedCorsHeaders,
  authenticatedUser,
  error,
  json,
  readJsonBody,
  serviceClient,
} from '../_shared/http.ts';

type AgoraTokenRequest = {
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

    const body = await readJsonBody<AgoraTokenRequest>(request);
    const callId = typeof body.call_id === 'string' ? body.call_id : '';
    if (!callId) return error('call_id is required', 400, responseHeaders);

    const appId = Deno.env.get('AGORA_APP_ID');
    const appCertificate = Deno.env.get('AGORA_APP_CERTIFICATE');
    if (!appId || !appCertificate) {
      return error('RTC service is unavailable', 503, responseHeaders);
    }

    const admin = serviceClient();
    const {data: call, error: callError} = await admin
      .from('calls')
      .select('id, caller_id, host_id, rtc_channel, status')
      .eq('id', callId)
      .single();
    if (callError || !call) return error('Call not found', 404, responseHeaders);
    if (user.id !== call.caller_id && user.id !== call.host_id) {
      return error('Forbidden', 403, responseHeaders);
    }
    if (['ended', 'missed', 'rejected'].includes(call.status)) {
      return error('Call is closed', 409, responseHeaders);
    }

    const uid = user.id.replaceAll('-', '').slice(0, 8);
    const numericUid = Number.parseInt(uid, 16) >>> 0;
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 60 * 60;
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      call.rtc_channel,
      numericUid,
      RtcRole.PUBLISHER,
      expiresAt,
      expiresAt,
    );

    return json({
      token,
      app_id: appId,
      channel: call.rtc_channel,
      uid: numericUid,
      expires_at: expiresAt,
    }, 200, responseHeaders);
  } catch (caught) {
    console.error('agora-token failed', caught);
    const status = caught instanceof Error && caught.message === 'REQUEST_BODY_TOO_LARGE'
      ? 413
      : caught instanceof Error && caught.message === 'INVALID_JSON_BODY'
      ? 400
      : 500;
    return error(status === 413 ? 'Request body is too large' : 'Unable to issue an RTC token', status, responseHeaders);
  }
});
