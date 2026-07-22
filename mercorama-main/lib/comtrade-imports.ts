// lib/comtrade-imports.ts
// Quota-aware Comtrade import demand connector.
// Used by backfillProvinceTrade — enforces 450 calls/day cap.
// Export Compass reads from trade_flows directly (via getComtradeMarketData supabaseOnly).
import 'server-only';
import { createServiceClient } from '@/lib/supabase';
import { config } from '@/lib/config';
import { cacheGet, cacheSet, TTL } from '@/lib/apiCache';

const COMTRADE_BASE  = 'https://comtradeapi.un.org/data/v1/get';
const DAILY_CAP      = 450;

// ISO3 → Comtrade numeric reporter code
const ISO3_TO_NUMERIC: Record<string, string> = {
  USA: '842', GBR: '826', DEU: '276', FRA: '250', JPN: '392',
  CHN: '156', KOR: '410', AUS: '036', NLD: '528', ITA: '380',
  ESP: '724', MEX: '484', BRA: '076', IND: '356', SWE: '752',
  CHE: '756', NOR: '578', DNK: '208', FIN: '246', BEL: '056',
  AUT: '040', POL: '616', PRT: '620', NZL: '554', SGP: '702',
  VNM: '704', MYS: '458', CHL: '152', PER: '604', COL: '170',
  ISR: '376', ARE: '784', SAU: '682', ZAF: '710', NGA: '566',
  EGY: '818', IDN: '360', THA: '764', PHL: '608', TWN: '158',
  HKG: '344', IRL: '372',
};

export interface TradeFlowRow {
  hs6Code:        string;
  reporterIso3:   string;
  year:           number;
  importValueUSD: number;
  source:         string;
  lastVerifiedAt: string;
}

// ── Quota helpers ──────────────────────────────────────────────────────────────

export async function getComtradeCallsToday(): Promise<number> {
  const db   = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await db
    .from('comtrade_quota')
    .select('calls_made')
    .eq('date', today)
    .maybeSingle();
  return data?.calls_made ?? 0;
}

async function incrementQuota(): Promise<void> {
  const db    = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);
  const current = await getComtradeCallsToday();
  await db.from('comtrade_quota').upsert(
    { date: today, calls_made: current + 1 },
    { onConflict: 'date' }
  );
}

// ── Main connector ─────────────────────────────────────────────────────────────

/**
 * Get import demand for hs6 + reporter country from trade_flows.
 * If missing and liveOk=true, calls Comtrade API (subject to daily cap).
 * Returns null if quota exhausted or data unavailable.
 */
export async function getComtradeImports(
  hs6Code:     string,
  reporterIso3: string,
  liveOk = true
): Promise<TradeFlowRow[] | null> {
  const db  = createServiceClient();
  const hs6 = hs6Code.replace(/\./g, '').slice(0, 6);

  // 1 — Check trade_flows (Supabase source of truth)
  const { data: rows } = await db
    .from('trade_flows')
    .select('year, import_value_usd, last_verified_at')
    .eq('hs_code', hs6)
    .eq('reporter_country', reporterIso3)
    .eq('partner_iso3', 'WLD')
    .eq('flow_type', 'import')
    .order('year', { ascending: false })
    .limit(6);

  if (rows && rows.length > 0) {
    return rows.map((r) => ({
      hs6Code:        hs6,
      reporterIso3,
      year:           r.year,
      importValueUSD: r.import_value_usd ?? 0,
      source:         'UN Comtrade',
      lastVerifiedAt: r.last_verified_at ?? new Date().toISOString(),
    }));
  }

  if (!liveOk || !config.comtradeApiKey) return null;

  // 2 — Check api_cache (raw payload)
  const cacheKey = `comtrade:${hs6}:${reporterIso3}`;
  const cached   = await cacheGet<{ rows: TradeFlowRow[] }>(cacheKey);
  if (cached?.rows) return cached.rows;

  // 3 — Quota check before live call
  const callsToday = await getComtradeCallsToday();
  if (callsToday >= DAILY_CAP) {
    console.warn(`[comtrade-imports] Daily cap (${DAILY_CAP}) reached — skipping ${hs6}/${reporterIso3}`);
    return null;
  }

  // 4 — Live Comtrade API call
  return fetchAndStore(hs6, reporterIso3);
}

async function fetchAndStore(hs6: string, reporterIso3: string): Promise<TradeFlowRow[] | null> {
  const reporterCode = ISO3_TO_NUMERIC[reporterIso3];
  if (!reporterCode) return null;

  const currentYear = new Date().getFullYear();
  const periods     = Array.from({ length: 5 }, (_, i) => currentYear - 1 - i).join(',');

  const url = new URL(`${COMTRADE_BASE}/C/A/HS`);
  url.searchParams.set('cmdCode',      hs6);
  url.searchParams.set('reporterCode', reporterCode);
  url.searchParams.set('period',       periods);
  url.searchParams.set('flowCode',     'M');
  url.searchParams.set('maxRecords',   '500');
  url.searchParams.set('format',       'JSON');
  url.searchParams.set('breakdownMode','classic');
  url.searchParams.set('subscription-key', config.comtradeApiKey!);

  try {
    const res = await fetch(url.toString(), {
      headers: { 'Ocp-Apim-Subscription-Key': config.comtradeApiKey! },
      signal:  AbortSignal.timeout(20_000),
    });

    await incrementQuota();

    if (!res.ok) {
      console.warn(`[comtrade-imports] API ${res.status} for ${hs6}/${reporterIso3}`);
      return null;
    }

    const json = await res.json() as {
      data?: Array<{ period: string | number; primaryValue: number }>;
    };

    if (!json.data || json.data.length === 0) return null;

    const db  = createServiceClient();
    const now = new Date().toISOString();
    const result: TradeFlowRow[] = [];

    for (const entry of json.data) {
      const year  = Number(String(entry.period).slice(0, 4));
      const value = entry.primaryValue ?? 0;

      await db.from('trade_flows').upsert({
        hs_code:          hs6,
        reporter_country: reporterIso3,
        partner_iso3:     'WLD',
        flow_type:        'import',
        year,
        import_value_usd: value,
        source_name:      'UN Comtrade',
        last_verified_at: now,
        confidence_level: 'current',
      }, { onConflict: 'hs_code,reporter_country,partner_iso3,year,flow_type' });

      result.push({ hs6Code: hs6, reporterIso3, year, importValueUSD: value, source: 'UN Comtrade', lastVerifiedAt: now });
    }

    // Cache raw rows for 30 days
    await cacheSet(`comtrade:${hs6}:${reporterIso3}`, { rows: result }, TTL.COMTRADE);

    return result;

  } catch (err) {
    console.error('[comtrade-imports] fetch error:', err);
    return null;
  }
}
