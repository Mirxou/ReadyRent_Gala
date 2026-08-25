// Production: replace with Redis via ioredis

const cache = new Map<string, { data: unknown; expiresAt: number }>();

export function getCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache(key: string, data: unknown, ttlMs: number = 60000) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function invalidateCache(pattern?: string) {
  if (!pattern) return cache.clear();
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
}
