import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for server-side CRM operations.`);
  }
  return value;
}

/**
 * Server-only Supabase client. The service-role key remains exclusively in
 * CRM server routes and must never be exposed to browser code.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('SUPABASE_URL is required for server-side CRM operations.');

  client = createClient(url, requiredEnvironment('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return client;
}

export function getOperationalAdminActorId(): string {
  return requiredEnvironment('OPERATIONAL_ADMIN_PROFILE_ID');
}

export async function assertOperationalAdmin(actorId: string): Promise<void> {
  const { data, error } = await getSupabaseAdmin()
    .from('profiles')
    .select('id, role, is_banned')
    .eq('id', actorId)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.is_banned || data.role !== 'admin') {
    throw new Error('ADMIN_ACCESS_REQUIRED');
  }
}
