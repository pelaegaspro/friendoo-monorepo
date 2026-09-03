import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Server-only privileged Supabase client. Elevated operations fail closed when the service-role key is absent.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key || !url.startsWith("https://")) {
    throw new Error('Privileged Supabase server configuration is required');
  }

  const timeoutFetch: typeof fetch = (input, init) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    return fetch(input, {
      ...init,
      signal: init?.signal ?? controller.signal,
    }).finally(() => clearTimeout(timeoutId));
  };

  client = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: timeoutFetch,
    },
  });

  return client;
}

export function getOperationalAdminActorId(): string {
  const actorId = process.env.OPERATIONAL_ADMIN_PROFILE_ID;
  if (!actorId) {
    throw new Error('OPERATIONAL_ADMIN_PROFILE_ID is required for privileged operations');
  }
  return actorId;
}

export async function assertOperationalAdmin(actorId: string): Promise<void> {
  if (!process.env.SUPABASE_URL) {
    throw new Error('Supabase server configuration is required');
  }
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('profiles')
      .select('id, role, is_banned')
      .eq('id', actorId)
      .maybeSingle();

    if (error) throw error;
    if (!data || data.is_banned || data.role !== 'admin') {
      throw new Error('ADMIN_ACCESS_REQUIRED');
    }
  } catch (error) {
    throw error;
  }
}
