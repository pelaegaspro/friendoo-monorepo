import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {
  allowedCorsHeaders,
  authenticatedUser,
  error,
  json,
  readJsonBody,
  serviceClient,
} from '../_shared/http.ts';

// Generates a VideoSDK JWT with the minimum permission needed to join a room.
async function generateVideoSdkJwt(
  apiKey: string,
  secretKey: string,
  permissions: string[],
  roomId?: string,
  participantId?: string,
): Promise<string> {
  const header = {alg: 'HS256', typ: 'JWT'};
  const now = Math.floor(Date.now() / 1000);
  const payload: Record<string, unknown> = {
    apikey: apiKey,
    permissions,
    version: 2,
    iat: now,
    exp: now + 86400,
  };

  if (roomId) payload.roomId = roomId;
  if (participantId) payload.participantId = participantId;

  const encoder = new TextEncoder();
  const base64UrlEncode = (data: Uint8Array | string): string => {
    const bytes = typeof data === 'string' ? encoder.encode(data) : data;
    let binary = '';
    for (let index = 0; index < bytes.length; index++) {
      binary += String.fromCharCode(bytes[index]);
    }
    return btoa(binary)
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = encoder.encode(`${encodedHeader}.${encodedPayload}`);

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign'],
  );

  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, dataToSign));
  const encodedSignature = base64UrlEncode(signature);

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

type VideoSdkTokenRequest = {
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

    const body = await readJsonBody<VideoSdkTokenRequest>(request);
    const callId = typeof body.call_id === 'string' ? body.call_id : '';
    if (!callId) return error('call_id is required', 400, responseHeaders);

    const apiKey = Deno.env.get('VIDEOSDK_API_KEY');
    const secretKey = Deno.env.get('VIDEOSDK_SECRET_KEY');
    if (!apiKey || !secretKey) {
      return error('VideoSDK is not configured', 503, responseHeaders);
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

    const roomId = `friendoo_${call.rtc_channel}`;
    const expiresAt = Math.floor(Date.now() / 1000) + 86400;
    const token = await generateVideoSdkJwt(
      apiKey,
      secretKey,
      ['allow_join', 'allow_mod'],
      roomId,
      user.id,
    );

    return json({
      token,
      room_id: roomId,
      participant_id: user.id,
      expires_at: expiresAt,
      provider: 'videosdk',
      rate_inr_per_min: 0.38,
    }, 200, responseHeaders);
  } catch (caught) {
    console.error('videosdk-token failed', caught);
    const status = caught instanceof Error && caught.message === 'REQUEST_BODY_TOO_LARGE'
      ? 413
      : caught instanceof Error && caught.message === 'INVALID_JSON_BODY'
      ? 400
      : 500;
    return error(status === 413 ? 'Request body is too large' : 'Unable to issue VideoSDK token', status, responseHeaders);
  }
});
