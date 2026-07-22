// lib/export-compass.ts
// Export Compass — data model, scoring, CRUD, and AI stub.
//
// AI data note: market intelligence is Claude-generated for now.
// Real data (UN Comtrade, ITC Trade Map) will be swapped in via
// analyzeWithModel() once the Supabase market_intelligence table is populated.
//
// Future Supabase schema (for reference when real data is available):
/*
  CREATE TABLE market_intelligence (
    id uuid primary key default gen_random_uuid(),
    hs_code text not null,
    country text not null,
    import_value_usd bigint,
    import_growth_5y numeric,
    canada_exports_value bigint,
    canada_market_share numeric,
    tariff_rate numeric,
    fta_available boolean default false,
    fta_name text,
    logistics_score numeric,
    risk_score numeric,
    demand_score numeric,
    growth_score numeric,
    canada_advantage_score numeric,
    market_access_score numeric,
    export_score numeric,
    last_updated timestamptz default now()
  );
*/

const STORAGE_KEY = 'mercorama_compass_sessions';

// ─── Country flag map ──────────────────────────────────────────────────────────

export const COUNTRY_FLAGS: Record<string, string> = {
  'United States':       '🇺🇸',
  'USA':                 '🇺🇸',
  'United Kingdom':      '🇬🇧',
  'UK':                  '🇬🇧',
  'Germany':             '🇩🇪',
  'France':              '🇫🇷',
  'Japan':               '🇯🇵',
  'China':               '🇨🇳',
  'South Korea':         '🇰🇷',
  'Korea':               '🇰🇷',
  'Australia':           '🇦🇺',
  'Netherlands':         '🇳🇱',
  'Italy':               '🇮🇹',
  'Spain':               '🇪🇸',
  'Mexico':              '🇲🇽',
  'Brazil':              '🇧🇷',
  'India':               '🇮🇳',
  'Sweden':              '🇸🇪',
  'Switzerland':         '🇨🇭',
  'Norway':              '🇳🇴',
  'Denmark':             '🇩🇰',
  'Finland':             '🇫🇮',
  'Belgium':             '🇧🇪',
  'Austria':             '🇦🇹',
  'Poland':              '🇵🇱',
  'Portugal':            '🇵🇹',
  'New Zealand':         '🇳🇿',
  'Singapore':           '🇸🇬',
  'Vietnam':             '🇻🇳',
  'Malaysia':            '🇲🇾',
  'Chile':               '🇨🇱',
  'Peru':                '🇵🇪',
  'Colombia':            '🇨🇴',
  'Israel':              '🇮🇱',
  'United Arab Emirates':'🇦🇪',
  'UAE':                 '🇦🇪',
  'Saudi Arabia':        '🇸🇦',
  'South Africa':        '🇿🇦',
  'Nigeria':             '🇳🇬',
  'Egypt':               '🇪🇬',
  'Indonesia':           '🇮🇩',
  'Thailand':            '🇹🇭',
  'Philippines':         '🇵🇭',
  'Taiwan':              '🇹🇼',
  'Hong Kong':           '🇭🇰',
  'Iceland':             '🇮🇸',
  'Ireland':             '🇮🇪',
  'Greece':              '🇬🇷',
  'Czechia':             '🇨🇿',
  'Hungary':             '🇭🇺',
  'Romania':             '🇷🇴',
  'Slovakia':            '🇸🇰',
  'Croatia':             '🇭🇷',
  'Luxembourg':          '🇱🇺',
  'Costa Rica':          '🇨🇷',
  'Panama':              '🇵🇦',
  'Honduras':            '🇭🇳',
  'Brunei':              '🇧🇳',
};

export function getFlag(country: string): string {
  return COUNTRY_FLAGS[country] ?? '🌐';
}

// ─── Data trust types ──────────────────────────────────────────────────────────

export type SourceTag = 'Stats Canada' | 'UN Comtrade' | 'World Bank' | 'Estimated' | 'Manual';
export type ConfidenceLevel = 'verified' | 'current' | 'aging' | 'stale' | 'estimated';

export interface MarketDataSources {
  tradeStats:    SourceTag;   // importValueUSD, importGrowth5y
  canadaShare:   SourceTag;   // canadaExportShare
  tariffData:    SourceTag;   // tariffRate
  ftaData:       SourceTag;   // ftaAvailable, ftaName
  scores:        SourceTag;   // all sub-scores
  confidenceLevel: ConfidenceLevel;
  lastVerifiedAt:  string | null; // ISO-8601 or null
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface MarketScores {
  /** Demand (30%): size and receptiveness of the import market */
  demand: number;
  /** Growth (20%): 5-year import growth trajectory */
  growth: number;
  /** Canada Advantage (20%): Canada's existing competitiveness in this market */
  canadaAdvantage: number;
  /** Market Access (15%): tariff environment, FTA availability */
  marketAccess: number;
  /** Logistics (10%): distance, shipping complexity, infrastructure */
  logistics: number;
  /** Risk (5%): regulatory, political, and currency risk */
  risk: number;
}

export interface MarketIntelligenceCard {
  country: string;
  regionCode: string;
  ftaName: string | null;       // e.g. "CETA", "CPTPP", null
  ftaAvailable: boolean;

  // Raw trade signals (AI-generated stub; real data via Comtrade later)
  importValueUSD: string;       // e.g. "$420M"
  importGrowth5y: string;       // e.g. "+7.4%"
  canadaExportShare: string;    // e.g. "22%"
  tariffRate: string;           // e.g. "0%" or "12.5%"
  topCompetitors: string[];     // e.g. ["Finland","Sweden","Australia"]

  // Mercorama Export Score (0–100)
  exportScore: number;

  // Score sub-components
  scores: MarketScores;

  // AI-generated insight (< 120 words)
  insight: string;

  // Data trust (DT-1)
  dataSources: MarketDataSources;
}

export interface ExportCompassSession {
  id: string;
  createdAt: string;    // ISO-8601
  updatedAt: string;

  // Input
  productDescription: string;
  hsCode: string | null;
  originCountry: string;    // default "Canada"

  // Results
  productLabel: string;     // resolved product name
  recommendedMarkets: MarketIntelligenceCard[];

  // State
  status: 'pending' | 'complete' | 'error';
}

export type CompassSessionCreateInput = Omit<ExportCompassSession, 'id' | 'createdAt' | 'updatedAt'>;

// ─── Scoring algorithm ─────────────────────────────────────────────────────────

/**
 * Compute the weighted Mercorama Export Score (0–100).
 *
 * Weights:
 *  - Demand         30% — biggest market opportunity matters most
 *  - Growth         20% — future-looking; SMEs need fast-growing markets
 *  - Canada Adv.    20% — confirms Canada is already competitive here
 *  - Market Access  15% — FTA tariff edges compound over time
 *  - Logistics      10% — distance and shipping complexity
 *  - Risk            5% — regulatory / political risk (low weight: SMEs self-select)
 */
export function computeExportScore(scores: MarketScores): number {
  return Math.round(
    0.30 * scores.demand +
    0.20 * scores.growth +
    0.20 * scores.canadaAdvantage +
    0.15 * scores.marketAccess +
    0.10 * scores.logistics +
    0.05 * scores.risk
  );
}

// ─── AI provider stub ──────────────────────────────────────────────────────────

/**
 * analyzeWithModel — abstraction layer over Claude / Ollama.
 * Swap `provider` to 'ollama' once the local SLM is running.
 * All prompt logic lives here so there is one place to change.
 */
export async function analyzeWithModel(
  systemPrompt: string,
  userPrompt: string,
  provider: 'claude' | 'ollama' = 'claude'
): Promise<string> {
  if (provider === 'ollama') {
    // TODO: wire to Ollama REST endpoint when SLM is live
    // const res = await fetch('http://localhost:11434/api/generate', { ... });
    throw new Error('Ollama provider not yet implemented');
  }
  // Delegate to server-side Claude call via the API route
  throw new Error('analyzeWithModel() must be called server-side via the API route');
}

// ─── localStorage CRUD ────────────────────────────────────────────────────────

function load(): Record<string, ExportCompassSession> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ExportCompassSession>) : {};
  } catch {
    return {};
  }
}

function persist(sessions: Record<string, ExportCompassSession>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export async function createCompassSession(
  input: CompassSessionCreateInput
): Promise<ExportCompassSession> {
  const all = load();
  const now = new Date().toISOString();
  const session: ExportCompassSession = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  all[session.id] = session;
  persist(all);
  return session;
}

export async function updateCompassSession(
  id: string,
  patch: Partial<ExportCompassSession>
): Promise<ExportCompassSession> {
  const all = load();
  const existing = all[id];
  if (!existing) throw new Error(`ExportCompassSession ${id} not found`);
  const updated: ExportCompassSession = {
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

export async function getCompassSession(id: string): Promise<ExportCompassSession | null> {
  return load()[id] ?? null;
}

export async function listCompassSessions(): Promise<ExportCompassSession[]> {
  return Object.values(load()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
