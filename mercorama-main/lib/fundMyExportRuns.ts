// lib/fundMyExportRuns.ts
// Server-side monthly run-limit for Fund My Export (max 5 runs/user/month)

import { createServiceClient } from '@/lib/supabase';

// Growth (team) = 50 runs/month; enterprise = unlimited (skip DB check)
const PLAN_MONTHLY_LIMITS: Record<string, number> = {
  team:       50,
  enterprise: Infinity,
};
const MONTHLY_LIMIT = 50; // default for team

function currentYearMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export interface RunStatus {
  runs_used: number;
  runs_remaining: number;
  limit: number;
  can_run: boolean;
  year_month: string;
}

/**
 * Returns the current run status for a user without incrementing.
 */
export async function getRunStatus(userId: string, plan = 'team'): Promise<RunStatus> {
  const limit = PLAN_MONTHLY_LIMITS[plan] ?? MONTHLY_LIMIT;

  // Enterprise: always unlimited
  if (limit === Infinity) {
    return { runs_used: 0, runs_remaining: Infinity, limit: Infinity, can_run: true, year_month: currentYearMonth() };
  }

  const supabase = createServiceClient();
  const yearMonth = currentYearMonth();

  const { data, error } = await supabase
    .from('fund_my_export_runs')
    .select('run_count')
    .eq('user_id', userId)
    .eq('year_month', yearMonth)
    .maybeSingle();

  if (error) {
    console.error('[mercorama] getRunStatus error:', error.message);
    throw new Error('Failed to fetch run status');
  }

  const used = data?.run_count ?? 0;
  return {
    runs_used: used,
    runs_remaining: Math.max(0, limit - used),
    limit,
    can_run: used < limit,
    year_month: yearMonth,
  };
}

/**
 * Checks if the user can run and atomically increments the counter.
 * Returns the updated RunStatus. If `can_run` is false, the counter
 * is NOT incremented and the caller should reject the request.
 */
export async function checkAndIncrementRun(
  userId: string,
  plan = 'team'
): Promise<RunStatus> {
  const limit = PLAN_MONTHLY_LIMITS[plan] ?? MONTHLY_LIMIT;

  // Enterprise: always allow, skip DB
  if (limit === Infinity) {
    return { runs_used: 0, runs_remaining: Infinity, limit: Infinity, can_run: true, year_month: currentYearMonth() };
  }

  const supabase = createServiceClient();
  const yearMonth = currentYearMonth();

  // Upsert: insert row with count=1 or increment existing count
  const { data, error } = await supabase.rpc('increment_fund_my_export_run', {
    p_user_id: userId,
    p_year_month: yearMonth,
    p_limit: limit,
  });

  if (error) {
    // RPC not yet available — fall back to manual upsert
    return fallbackCheckAndIncrement(userId, yearMonth, limit);
  }

  const result = data as { run_count: number; incremented: boolean } | null;
  const used = result?.run_count ?? 0;
  const incremented = result?.incremented ?? false;

  if (!incremented) {
    return { runs_used: used, runs_remaining: 0, limit, can_run: false, year_month: yearMonth };
  }

  return {
    runs_used: used,
    runs_remaining: Math.max(0, limit - used),
    limit,
    can_run: true,
    year_month: yearMonth,
  };
}

/**
 * Fallback when the RPC function is unavailable.
 * Uses a read-then-upsert pattern (not atomic, but acceptable for soft limits).
 */
async function fallbackCheckAndIncrement(
  userId: string,
  yearMonth: string,
  limit: number
): Promise<RunStatus> {
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from('fund_my_export_runs')
    .select('run_count')
    .eq('user_id', userId)
    .eq('year_month', yearMonth)
    .maybeSingle();

  const current = existing?.run_count ?? 0;

  if (current >= limit) {
    return { runs_used: current, runs_remaining: 0, limit, can_run: false, year_month: yearMonth };
  }

  const newCount = current + 1;

  const { error: upsertError } = await supabase
    .from('fund_my_export_runs')
    .upsert(
      { user_id: userId, year_month: yearMonth, run_count: newCount, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,year_month' }
    );

  if (upsertError) {
    console.error('[mercorama] fallbackCheckAndIncrement error:', upsertError.message);
    throw new Error('Failed to update run count');
  }

  return {
    runs_used: newCount,
    runs_remaining: Math.max(0, limit - newCount),
    limit,
    can_run: true,
    year_month: yearMonth,
  };
}
