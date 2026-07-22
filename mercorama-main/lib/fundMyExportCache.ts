// lib/fundMyExportCache.ts
// Result caching for Fund My Export (TTL: 24 hours)

import { createServiceClient } from '@/lib/supabase';
import type { FundingMatchResult, FundingQuery } from './fundMyExport';

const CACHE_TTL_HOURS = 24;

/**
 * Builds a stable, deterministic cache key from the query parameters.
 */
export function getCacheKey(query: FundingQuery): string {
  const parts = [
    normalise(query.sector),
    normalise(query.destination_country),
    String(query.revenue_cad ?? ''),
    String(query.employees ?? ''),
    String(query.export_value_usd ?? ''),
    query.has_fta ? '1' : '0',
  ];
  return `fme:${parts.join('|')}`;
}

function normalise(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, '-');
}

/**
 * Returns cached results if they exist and have not expired.
 * Returns null on cache miss or expiry.
 */
export async function getCachedResults(
  cacheKey: string
): Promise<FundingMatchResult | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('funding_results_cache')
    .select('results, expires_at')
    .eq('cache_key', cacheKey)
    .maybeSingle();

  if (error) {
    console.error('[mercorama] getCachedResults error:', error.message);
    return null;
  }

  if (!data) return null;

  const expiresAt = new Date(data.expires_at);
  if (expiresAt < new Date()) {
    // Expired — delete in background, return null
    supabase
      .from('funding_results_cache')
      .delete()
      .eq('cache_key', cacheKey)
      .then(() => {});
    return null;
  }

  return data.results as FundingMatchResult;
}

/**
 * Stores results in the cache with the configured TTL.
 * Uses upsert so stale entries are refreshed in place.
 */
export async function setCachedResults(
  cacheKey: string,
  results: FundingMatchResult
): Promise<void> {
  const supabase = createServiceClient();

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + CACHE_TTL_HOURS);

  const { error } = await supabase.from('funding_results_cache').upsert(
    {
      cache_key: cacheKey,
      results: results as unknown as Record<string, unknown>,
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    },
    { onConflict: 'cache_key' }
  );

  if (error) {
    // Cache write failure is non-fatal — log and continue
    console.error('[mercorama] setCachedResults error:', error.message);
  }
}

/**
 * Removes all expired cache entries. Called by the weekly sync cron.
 */
export async function purgeExpiredCache(): Promise<number> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('funding_results_cache')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('cache_key');

  if (error) {
    console.error('[mercorama] purgeExpiredCache error:', error.message);
    return 0;
  }

  return data?.length ?? 0;
}
