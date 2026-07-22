// lib/fta-usage.ts
// Client-side usage counter for FTA Diversify analyses.
// Resets automatically each calendar month.

const STORAGE_KEY = 'mercorama_fta_usage';

export interface FtaUsage {
  monthKey: string;         // 'YYYY-MM'
  used: number;
  limit: number | null;     // null = unlimited
}

// Per-plan monthly limits
const PLAN_LIMITS: Record<string, number | null> = {
  pro:        0,    // Starter — no access
  team:       50,   // Growth
  enterprise: null, // Unlimited
};

function getMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function loadRaw(): FtaUsage | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FtaUsage) : null;
  } catch {
    return null;
  }
}

function persistUsage(usage: FtaUsage): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
}

/** Return current month's usage for the given plan (resets counter if new month). */
export function getFtaUsage(plan = 'team'): FtaUsage {
  const monthKey = getMonthKey();
  const stored = loadRaw();
  const limit = PLAN_LIMITS[plan] ?? 30;

  if (!stored || stored.monthKey !== monthKey) {
    // New month — reset counter
    const fresh: FtaUsage = { monthKey, used: 0, limit };
    persistUsage(fresh);
    return fresh;
  }

  return { ...stored, limit };
}

/** Increment the counter by 1 after a successful analysis. */
export function incrementFtaUsage(): void {
  const monthKey = getMonthKey();
  const stored = loadRaw();
  const updated: FtaUsage = {
    monthKey,
    used: stored && stored.monthKey === monthKey ? stored.used + 1 : 1,
    limit: stored?.limit ?? 30,
  };
  persistUsage(updated);
}

/** Returns true if the user is within their monthly limit. */
export function checkFtaLimit(plan = 'team'): { allowed: boolean; usage: FtaUsage } {
  const usage = getFtaUsage(plan);
  if (usage.limit === null) return { allowed: true, usage };
  return { allowed: usage.used < usage.limit, usage };
}
