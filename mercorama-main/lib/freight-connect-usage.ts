// lib/freight-connect-usage.ts
// Client-side monthly run counter for Freight Connect searches.
// Resets automatically each calendar month.

const STORAGE_KEY = 'mercorama_fc_usage';

export interface FreightConnectUsage {
  monthKey: string;       // 'YYYY-MM'
  used: number;
  limit: number | null;   // null = unlimited
}

// Per-plan monthly limits
const PLAN_LIMITS: Record<string, number | null> = {
  pro:        30,   // Starter
  team:       50,   // Growth
  enterprise: null, // Unlimited
};

function getMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function loadRaw(): FreightConnectUsage | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FreightConnectUsage) : null;
  } catch {
    return null;
  }
}

function persistUsage(usage: FreightConnectUsage): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
}

export function getFreightConnectUsage(plan = 'pro'): FreightConnectUsage {
  const monthKey = getMonthKey();
  const stored = loadRaw();
  const limit = PLAN_LIMITS[plan] ?? 30;

  if (!stored || stored.monthKey !== monthKey) {
    const fresh: FreightConnectUsage = { monthKey, used: 0, limit };
    persistUsage(fresh);
    return fresh;
  }

  return { ...stored, limit };
}

export function incrementFreightConnectUsage(): void {
  const monthKey = getMonthKey();
  const stored = loadRaw();
  const updated: FreightConnectUsage = {
    monthKey,
    used: stored && stored.monthKey === monthKey ? stored.used + 1 : 1,
    limit: stored?.limit ?? 30,
  };
  persistUsage(updated);
}

export function checkFreightConnectLimit(plan = 'pro'): { allowed: boolean; usage: FreightConnectUsage } {
  const usage = getFreightConnectUsage(plan);
  if (usage.limit === null) return { allowed: true, usage };
  return { allowed: usage.used < usage.limit, usage };
}
