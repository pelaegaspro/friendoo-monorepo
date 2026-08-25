'use client'

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const clientCache = new Map<string, CacheItem<unknown>>();
const pendingRequests = new Map<string, Promise<unknown>>();

export interface AdminFetchOptions extends RequestInit {
  forceRefresh?: boolean;
  ttlMs?: number;
}

/**
 * High-performance client-side fetcher with instant cache hits and background SWR.
 * Makes page transitions across Admin tabs feel instantaneous (<1ms).
 */
export async function adminFetch<T>(input: RequestInfo | URL, init?: AdminFetchOptions): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  const method = (init?.method || 'GET').toUpperCase();
  const urlKey = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
  const isGet = method === 'GET';
  const ttl = init?.ttlMs ?? 15000; // 15-second default TTL
  const now = Date.now();

  // On non-GET mutations, clear relevant cache
  if (!isGet) {
    clientCache.clear();
  }

  // Check cache for GET requests unless forceRefresh is set
  if (isGet && !init?.forceRefresh) {
    const cached = clientCache.get(urlKey) as CacheItem<T> | undefined;
    if (cached) {
      const isFresh = now - cached.timestamp < ttl;
      if (isFresh) {
        return cached.data;
      }
      // Stale-while-revalidate in background
      fetch(input, {
        ...init,
        headers: { ...(init?.headers ?? {}), 'Content-Type': 'application/json' },
        credentials: 'include',
      })
        .then(async (res) => {
          if (res.ok) {
            const data = (await res.json()) as T;
            clientCache.set(urlKey, { data, timestamp: Date.now() });
          }
        })
        .catch(() => {});

      return cached.data;
    }

    const pending = pendingRequests.get(urlKey) as Promise<T> | undefined;
    if (pending) return pending;
  }

  const request = fetch(input, {
    ...init,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(init?.headers ?? {}),
    },
    credentials: 'include',
    cache: 'no-store',
  });
  if (isGet) pendingRequests.set(urlKey, request);

  const response = await request.finally(() => {
    if (isGet) pendingRequests.delete(urlKey);
  });

  const payload = (await response.json().catch(() => null)) as { error?: string } | T | null;
  if (!response.ok) {
    const errorMessage =
      payload && typeof payload === 'object' && 'error' in payload
        ? payload.error
        : 'Request failed';
    throw new Error(errorMessage);
  }

  if (isGet) {
    clientCache.set(urlKey, { data: payload, timestamp: now });
  }

  return payload as T;
}

export function clearAdminClientCache() {
  clientCache.clear();
}
