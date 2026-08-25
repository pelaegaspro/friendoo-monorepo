"use client";

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();
const pending = new Map<string, Promise<unknown>>();
const defaultTtlMs = 15000;

export async function crmFetch<T>(input: RequestInfo | URL, init?: RequestInit & { ttlMs?: number }): Promise<T> {
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
  const cached = cache.get(url) as CacheEntry<T> | undefined;
  if (cached && cached.expiresAt > now) return cached.data;

  const existing = pending.get(url) as Promise<T> | undefined;
  if (existing) return existing;

  const request = fetch(input, { ...init, cache: "no-store" })
    .then(async (response) => {
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Request failed");
      cache.set(url, { data: payload as T, expiresAt: Date.now() + (init?.ttlMs ?? defaultTtlMs) });
      return payload as T;
    })
    .finally(() => pending.delete(url));

  pending.set(url, request);
  return request;
}

export function clearCrmClientCache() {
  cache.clear();
}
