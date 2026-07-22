// lib/apiCache.ts
// Supabase-backed API cache with TTL — replaces Redis for on-prem VPS.
// Key patterns: statcan:[hs]:[cc]  comtrade:[hs]:[year]  usitc:[hts]
// Swap to ioredis later by replacing get/set/del below.
import 'server-only';
import { createServiceClient } from '@/lib/supabase';

export async function cacheGet<T>(key: string): Promise<T | null> {
  const db = createServiceClient();
  const { data } = await db
    .from('api_cache')
    .select('value, expires_at')
    .eq('cache_key', key)
    .maybeSingle();

  if (!data) return null;
  if (new Date(data.expires_at) < new Date()) {
    // Expired — delete async, return miss
    void db.from('api_cache').delete().eq('cache_key', key);
    return null;
  }
  return data.value as T;
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  const db = createServiceClient();
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  await db
    .from('api_cache')
    .upsert({ cache_key: key, value, expires_at: expiresAt })
    .eq('cache_key', key);
}

// TTL constants (seconds)
export const TTL = {
  STATCAN:  30 * 24 * 60 * 60,   // 30 days
  COMTRADE: 30 * 24 * 60 * 60,   // 30 days
  USITC:    24 * 60 * 60,         // 24 hours
} as const;
