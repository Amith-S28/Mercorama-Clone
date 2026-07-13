interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const TTL = 24 * 60 * 60 * 1000; // 24 hours

export function getCachedComtrade(key: string): unknown {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedComtrade(key: string, data: unknown) {
  cache.set(key, { data, timestamp: Date.now() });
}
