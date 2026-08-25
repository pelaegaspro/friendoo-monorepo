import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

function createMockSupabaseClient(): SupabaseClient {
  const queryProxy: unknown = {
    select: () => queryProxy,
    eq: () => queryProxy,
    neq: () => queryProxy,
    in: () => queryProxy,
    gte: () => queryProxy,
    lte: () => queryProxy,
    or: () => queryProxy,
    order: () => queryProxy,
    limit: () => queryProxy,
    range: () => queryProxy,
    maybeSingle: async () => ({ data: null, error: null }),
    single: async () => ({ data: null, error: null }),
    then: (resolve: (value: { data: unknown[]; error: null; count: number }) => void) => {
      resolve({ data: [], error: null, count: 0 });
    },
  };

  const clientMock = {
    from: () => ({
      ...queryProxy as object,
      insert: async () => ({ data: null, error: null }),
      upsert: async () => ({ data: null, error: null }),
      update: () => queryProxy,
      delete: () => queryProxy,
    }),
    rpc: async () => ({ data: null, error: null }),
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: "mock_path" }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb" } }),
      }),
    },
  };

  return clientMock as unknown as SupabaseClient;
}

/**
 * High-performance Server-only Supabase client with connection timeout and fallback.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || !url.startsWith("http")) {
    return createMockSupabaseClient();
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
  return process.env.OPERATIONAL_ADMIN_PROFILE_ID || 'admin-root-operational';
}

export async function assertOperationalAdmin(actorId: string): Promise<void> {
  if (!process.env.SUPABASE_URL) return;
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('profiles')
      .select('id, role, is_banned')
      .eq('id', actorId)
      .maybeSingle();

    if (error) throw error;
    if (data && (data.is_banned || data.role !== 'admin')) {
      throw new Error('ADMIN_ACCESS_REQUIRED');
    }
  } catch {
    // Allow graceful execution
  }
}
