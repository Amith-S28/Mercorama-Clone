// lib/gate.ts
// Per-plan monthly usage limits for core tools.
// Tracked in localStorage, reset each calendar month.
// Fund My Export is server-side (fundMyExportRuns.ts).
// Export Compass is separate (export-compass-usage.ts).
// FTA Diversify is separate (fta-usage.ts).
// Freight Connect is separate (freight-connect-usage.ts).

export type Plan = 'pro' | 'team' | 'enterprise';

export interface GateResult {
  allowed: boolean;
  reason?: 'upgrade_required' | 'quota_exceeded';
  feature?: string;
  remaining?: number;
}

export interface UserWithPlan {
  id: string;
  plan: Plan;
  email: string;
}

export interface MonthlyUsage {
  total: number;
  incoterm: number;
  hscode: number;
  contract: number;
  payment: number;
  risk: number;
  deals: number;
}

// Per-tool monthly limits by plan
// Starter (pro): Incoterms/HS/DealSummary=30, DealWizard=15
// Growth  (team): Incoterms/HS/DealSummary=100, DealWizard=50
const LIMITS: Record<Plan, Record<string, number>> = {
  pro: {
    incoterm: 30,
    hscode:   30,
    contract: 30,
    deals:    15,
  },
  team: {
    incoterm: 100,
    hscode:   100,
    contract: 100,
    deals:    50,
  },
  enterprise: {
    incoterm: Infinity,
    hscode:   Infinity,
    contract: Infinity,
    deals:    Infinity,
  },
};

// Tools only available on Growth+ (enforced separately via plan-config.ts)
const GROWTH_ONLY = ['fta-diversify', 'fund-my-export'];

export function getUserWithPlan(userId: string): UserWithPlan {
  if (typeof window === 'undefined') return { id: userId, plan: 'pro', email: '' };
  const userData = localStorage.getItem('traderyt_user');
  if (userData) return JSON.parse(userData);
  return { id: 'default', plan: 'pro', email: '' };
}

export function getMonthlyUsage(userId: string): MonthlyUsage {
  if (typeof window === 'undefined') {
    return { total: 0, incoterm: 0, hscode: 0, contract: 0, payment: 0, risk: 0, deals: 0 };
  }
  const currentMonth = new Date().toISOString().slice(0, 7);
  const usageKey = `traderyt_usage_${currentMonth}`;
  const usageData = localStorage.getItem(usageKey);
  if (usageData) return JSON.parse(usageData);
  return { total: 0, incoterm: 0, hscode: 0, contract: 0, payment: 0, risk: 0, deals: 0 };
}

export function incrementUsage(userId: string, feature: string): void {
  if (typeof window === 'undefined') return;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const usageKey = `traderyt_usage_${currentMonth}`;
  const usage = getMonthlyUsage(userId);
  usage.total += 1;
  if (feature in usage) {
    (usage as Record<string, number>)[feature] += 1;
  }
  localStorage.setItem(usageKey, JSON.stringify(usage));
}

export async function checkUsageGate(userId: string, feature: string): Promise<GateResult> {
  const user = getUserWithPlan(userId);
  const usage = getMonthlyUsage(userId);

  // Growth-only features — Starter cannot access
  if (user.plan === 'pro' && GROWTH_ONLY.includes(feature)) {
    return { allowed: false, reason: 'upgrade_required', feature };
  }

  const planLimits = LIMITS[user.plan];
  const featureLimit = planLimits[feature] ?? Infinity;

  // Check per-feature limit
  const featureUsed = (usage as Record<string, number>)[feature] ?? 0;
  if (featureUsed >= featureLimit) {
    return { allowed: false, reason: 'quota_exceeded', remaining: 0 };
  }

  return { allowed: true, remaining: featureLimit === Infinity ? Infinity : featureLimit - featureUsed };
}

export function getResetDate(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
