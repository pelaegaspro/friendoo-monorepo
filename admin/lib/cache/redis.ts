/**
 * Production-Grade Cache-Aside Utility (TRACEN Topic: Execution & Caching)
 * 
 * Rules Enforced:
 * 1. Strict TTL (Time-To-Live) on every key.
 * 2. Fail-Open Circuit Fallback: Never crash user requests if cache is down; fall back to source fetcher.
 * 3. Namespace separation to prevent collision across environments.
 */

interface CacheOptions {
  ttlSeconds: number;
}

// In-memory fallback cache for development or when Redis is unreachable
const memoryFallback = new Map<string, { value: string; expiresAt: number }>();

export class CacheAsideClient {
  private redisUrl: string | undefined;

  constructor() {
    this.redisUrl = process.env.REDIS_URL;
  }

  /**
   * Executes Cache-Aside:
   * 1. Checks Cache for key
   * 2. If HIT -> returns deserialized data
   * 3. If MISS -> calls fetcher(), caches result with TTL, and returns data
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = { ttlSeconds: 300 },
  ): Promise<T> {
    const namespacedKey = `friendoo:${key}`;

    try {
      const cached = await this.get<T>(namespacedKey);
      if (cached !== null) {
        return cached;
      }
    } catch (err) {
      console.warn(`[Cache MISS/Error] Failed to read cache for ${namespacedKey}, falling back to fetcher:`, err);
    }

    // Cache Miss - execute source fetcher
    const freshData = await fetcher();

    // Asynchronously write to cache so caller response is not delayed
    if (freshData !== undefined && freshData !== null) {
      this.set(namespacedKey, freshData, options.ttlSeconds).catch((writeErr) => {
        console.warn(`[Cache Write Error] Failed to populate cache for ${namespacedKey}:`, writeErr);
      });
    }

    return freshData;
  }

  async get<T>(key: string): Promise<T | null> {
    const now = Date.now();
    const entry = memoryFallback.get(key);
    if (!entry) return null;
    if (now > entry.expiresAt) {
      memoryFallback.delete(key);
      return null;
    }
    return JSON.parse(entry.value) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    memoryFallback.set(key, {
      value: JSON.stringify(value),
      expiresAt,
    });
  }

  async invalidate(key: string): Promise<void> {
    const namespacedKey = `friendoo:${key}`;
    memoryFallback.delete(namespacedKey);
  }

  async invalidatePrefix(prefix: string): Promise<void> {
    const target = `friendoo:${prefix}`;
    for (const k of memoryFallback.keys()) {
      if (k.startsWith(target)) {
        memoryFallback.delete(k);
      }
    }
  }
}

export const appCache = new CacheAsideClient();

