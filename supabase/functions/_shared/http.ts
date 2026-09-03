import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2';

export const MAX_REQUEST_BODY_BYTES = 16 * 1024;

const defaultAllowedOrigins = new Set([
  'https://friendoo.in',
  'https://www.friendoo.in',
]);

function allowedOrigins(): Set<string> {
  const configured = Deno.env.get('APP_ALLOWED_ORIGINS')
    ?.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.startsWith('https://')) ?? [];
  return new Set([...defaultAllowedOrigins, ...configured]);
}

export const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
};

export function allowedCorsHeaders(request: Request) {
  const origin = request.headers.get('Origin');
  if (!origin) return corsHeaders;
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (isLocalhost || allowedOrigins().has(origin)) {
    return {
      ...corsHeaders,
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
    };
  }
  return corsHeaders;
}

export function json(data: unknown, status = 200, headers = corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...headers,
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json',
    },
  });
}

export function error(message: string, status = 400, headers = corsHeaders) {
  return json({error: message}, status, headers);
}

export async function readBodyLimited(
  request: Request,
  maxBytes = MAX_REQUEST_BODY_BYTES,
): Promise<string> {
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new Error('REQUEST_BODY_TOO_LARGE');
  }

  if (!request.body) return '';

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      receivedBytes += value.byteLength;
      if (receivedBytes > maxBytes) {
        await reader.cancel();
        throw new Error('REQUEST_BODY_TOO_LARGE');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(receivedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export async function readJsonBody<T>(request: Request, maxBytes = MAX_REQUEST_BODY_BYTES): Promise<T> {
  const raw = await readBodyLimited(request, maxBytes);
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error('INVALID_JSON_BODY');
  }
}

export function serviceClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRoleKey) throw new Error('Supabase service credentials are unavailable.');
  return createClient(url, serviceRoleKey, {auth: {persistSession: false}});
}

export async function authenticatedUser(request: Request) {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return null;

  const url = Deno.env.get('SUPABASE_URL');
  const publishableKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !publishableKey) throw new Error('Supabase client credentials are unavailable.');

  const client = createClient(url, publishableKey, {
    global: {headers: {Authorization: authorization}},
    auth: {persistSession: false},
  });
  const {data, error: authError} = await client.auth.getUser();
  if (authError || !data.user) return null;
  return data.user;
}

type SecurityEvent = {
  eventType: string;
  outcome: 'accepted' | 'rejected' | 'duplicate' | 'failed';
  actorId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  requestFingerprint?: string | null;
  metadata?: Record<string, unknown>;
};

export async function recordSecurityEvent(
  admin: SupabaseClient,
  event: SecurityEvent,
): Promise<void> {
  const {error: auditError} = await admin.from('security_audit_events').insert({
    event_type: event.eventType,
    outcome: event.outcome,
    actor_id: event.actorId ?? null,
    target_type: event.targetType ?? null,
    target_id: event.targetId ?? null,
    request_fingerprint: event.requestFingerprint ?? null,
    metadata: event.metadata ?? {},
  });
  if (auditError) {
    console.error('security audit event could not be recorded', auditError.code);
  }
}
