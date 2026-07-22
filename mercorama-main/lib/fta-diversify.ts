// lib/fta-diversify.ts
// FTA Diversify session persistence — localStorage-backed, mirrors lib/deals.ts.

const STORAGE_KEY = 'mercorama_fta_sessions';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FtaMarketSummary {
  regionCode: string;       // e.g. 'EU', 'CPTPP', 'EFTA'
  country: string;          // e.g. 'Germany'
  ftaName: string;          // e.g. 'CETA'
  rationale: string;        // why this market for this product
  tariffNote: string;       // plain-language tariff advantage
  marketSnapshot: {
    marketSizeNote: string;
    keySegments: string[];
    demographicsNote: string;
    spendingNote: string;
    outlookNote: string;
  };
  riskFlags: string[];      // e.g. ['Regulatory approval required', 'Long logistics lead time']
}

export interface EnhancedFtaMarketSummary extends FtaMarketSummary {
  tariffInsight?: {
    baseTariffEstimate?: string;
    ftaTariffEstimate?: string;
    savingsInsight?: string;
    advantageLevel?: 'high' | 'medium' | 'low';
  };
  eligibility?: {
    rulesOfOriginNote?: string;
    documentationRequired?: string[];
    readinessLevel?: 'easy' | 'moderate' | 'complex';
  };
  marketFit?: {
    bestFor?: string;
    entryDifficulty?: 'low' | 'medium' | 'high';
    timeToMarket?: string;
  };
  decisionNote?: string;
}

export interface FtaDiversifySession {
  id: string;
  createdAt: string;        // ISO-8601
  updatedAt: string;

  // SME profile
  companyName?: string;
  province?: string;
  sector?: string;
  currentMarkets?: string[]; // e.g. ['US']

  // Product
  hsCode?: string;
  productDescription: string;

  // Objectives
  objective?: string;

  // AI results
  suggestedMarkets: FtaMarketSummary[];

  // Shortlist (optional)
  shortlistedMarkets?: string[];
}

export type FtaSessionCreateInput = Omit<FtaDiversifySession, 'id' | 'createdAt' | 'updatedAt'>;

// ─── Internal helpers ─────────────────────────────────────────────────────────

function load(): Record<string, FtaDiversifySession> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, FtaDiversifySession>) : {};
  } catch {
    return {};
  }
}

function persist(sessions: Record<string, FtaDiversifySession>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function createFtaSession(
  input: Partial<FtaSessionCreateInput>
): Promise<FtaDiversifySession> {
  const all = load();
  const now = new Date().toISOString();
  const session: FtaDiversifySession = {
    productDescription: '',
    suggestedMarkets: [],
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  all[session.id] = session;
  persist(all);
  return session;
}

export async function updateFtaSession(
  id: string,
  patch: Partial<FtaDiversifySession>
): Promise<FtaDiversifySession> {
  const all = load();
  const existing = all[id];
  if (!existing) throw new Error(`FtaDiversifySession ${id} not found`);
  const updated: FtaDiversifySession = {
    ...existing,
    ...patch,
    id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  all[id] = updated;
  persist(all);
  return updated;
}

export async function getFtaSession(id: string): Promise<FtaDiversifySession | null> {
  return load()[id] ?? null;
}

export async function listFtaSessions(): Promise<FtaDiversifySession[]> {
  return Object.values(load()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
