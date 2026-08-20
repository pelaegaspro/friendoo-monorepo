import { createClient } from 'npm:@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {...corsHeaders, 'Content-Type': 'application/json'},
  });
}

export function error(message: string, status = 400) {
  return json({error: message}, status);
}

export function serviceClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRoleKey) throw new Error('Supabase service credentials are unavailable.');
  return createClient(url, serviceRoleKey, {auth: {persistSession: false}});
}

export async function authenticatedUser(request: Request) {
  const authorization = request.headers.get('Authorization');
  if (!authorization) return null;

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
