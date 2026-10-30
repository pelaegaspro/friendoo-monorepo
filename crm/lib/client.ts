"use client";

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const cache = new Map<string, CacheEntry<unknown>>();
const pending = new Map<string, Promise<unknown>>();
const defaultTtlMs = 60000; // 60s cache TTL for lightning-fast tab navigation

export async function crmFetch<T>(input: RequestInfo | URL, init?: RequestInit & { ttlMs?: number; forceRefresh?: boolean }): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

  if (method !== "GET") {
    cache.clear();
    return fetch(input, init).then(async (response) => {
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Request failed");
      return payload as T;
    });
  }

  const now = Date.now();
  const ttl = init?.ttlMs ?? defaultTtlMs;
  const cached = cache.get(url) as CacheEntry<T> | undefined;

  // Instant Cache / Stale-While-Revalidate: Return immediately (<1ms) if cached
  if (cached && !init?.forceRefresh) {
    const isFresh = now - cached.timestamp < ttl;
    if (isFresh) {
      return cached.data;
    }

    // Refresh in background without blocking the UI
    fetch(input, { ...init, cache: "no-store" })
      .then(async (response) => {
        if (response.ok) {
          const payload = (await response.json().catch(() => null)) as T;
          if (payload) {
            cache.set(url, { data: payload, timestamp: Date.now() });
          }
        }
      })
      .catch(() => {});

    return cached.data;
  }

  const existing = pending.get(url) as Promise<T> | undefined;
  if (existing) return existing;

  const request = fetch(input, { ...init, cache: "no-store" })
    .then(async (response) => {
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Request failed");
      cache.set(url, { data: payload as T, timestamp: Date.now() });
      return payload as T;
    })
    .finally(() => pending.delete(url));

  pending.set(url, request);
  return request;
}

export function clearCrmClientCache() {
  cache.clear();
}
