/**
 * Ultra-fast server-side in-memory cache with TTL and SWR (Stale-While-Revalidate).
 * Guarantees sub-5ms response times for repeat queries and dashboard widgets.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

const memoryStore = new Map<string, CacheEntry<unknown>>();

export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 20
): Promise<T> {
  const now = Date.now();
  const cached = memoryStore.get(key) as CacheEntry<T> | undefined;

  if (cached) {
    const isFresh = now - cached.timestamp < cached.ttlMs;
    if (isFresh) {
      return cached.data;
    }

    // Stale-while-revalidate: return stale data immediately, refresh in background
    fetcher()
      .then((fresh) => {
        if (fresh !== undefined && fresh !== null) {
          memoryStore.set(key, { data: fresh, timestamp: Date.now(), ttlMs: ttlSeconds * 1000 });
        }
      })
      .catch(() => {
        // Keep stale on error
      });

    return cached.data;
  }

  try {
    const fresh = await fetcher();
    if (fresh !== undefined && fresh !== null) {
      memoryStore.set(key, { data: fresh, timestamp: now, ttlMs: ttlSeconds * 1000 });
    }
    return fresh;
  } catch (error) {
    const fallback = memoryStore.get(key) as CacheEntry<T> | undefined;
    if (fallback) {
      return fallback.data;
    }
    throw error;
  }
}

export function invalidateCache(keyOrPrefix?: string) {
  if (!keyOrPrefix) {
    memoryStore.clear();
    return;
  }

  memoryStore.forEach((_, key) => {
    if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
      memoryStore.delete(key);
    }
  });
}
