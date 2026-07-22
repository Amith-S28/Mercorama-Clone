// lib/export-compass-usage.ts
// Client-side usage counter for Export Compass analyses.
// Resets automatically each calendar month.

const STORAGE_KEY = 'mercorama_compass_usage';

export interface CompassUsage {
  monthKey: string;       // 'YYYY-MM'
  used: number;
  limit: number | null;   // null = unlimited
}

// Per-plan monthly limits
const PLAN_LIMITS: Record<string, number | null> = {
  pro:        10,   // Starter
  team:       50,   // Growth
  enterprise: null, // Unlimited
};

function getMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function loadRaw(): CompassUsage | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CompassUsage) : null;
  } catch {
    return null;
  }
}

function persistUsage(usage: CompassUsage): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
}

export function getCompassUsage(plan = 'team'): CompassUsage {
  const monthKey = getMonthKey();
  const stored = loadRaw();
  const limit = PLAN_LIMITS[plan] ?? 20;

  if (!stored || stored.monthKey !== monthKey) {
    const fresh: CompassUsage = { monthKey, used: 0, limit };
    persistUsage(fresh);
    return fresh;
  }

  return { ...stored, limit };
}

export function incrementCompassUsage(): void {
  const monthKey = getMonthKey();
  const stored = loadRaw();
  const updated: CompassUsage = {
    monthKey,
    used: stored && stored.monthKey === monthKey ? stored.used + 1 : 1,
    limit: stored?.limit ?? 20,
  };
  persistUsage(updated);
}

export function checkCompassLimit(plan = 'team'): { allowed: boolean; usage: CompassUsage } {
  const usage = getCompassUsage(plan);
  if (usage.limit === null) return { allowed: true, usage };
  return { allowed: usage.used < usage.limit, usage };
}
