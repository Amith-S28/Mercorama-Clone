// lib/comtrade.ts
// EC-1.2 — UN Comtrade+ API connector.
// Pulls global import demand by HS code + destination country.
// API docs: https://comtradeapi.un.org/
// Free tier: 500 calls/day — requests are batched and cached (30-day TTL).
import 'server-only';
import { createServiceClient } from '@/lib/supabase';
import { cacheGet, cacheSet, TTL } from '@/lib/apiCache';
import { config } from '@/lib/config';

const COMTRADE_BASE = 'https://comtradeapi.un.org/data/v1/get';

// ISO 3 numeric codes used by Comtrade → ISO 3166-1 alpha-3
const COMTRADE_COUNTRY_CODES: Record<string, string> = {
  '842': 'USA', '826': 'GBR', '276': 'DEU', '250': 'FRA', '392': 'JPN',
  '156': 'CHN', '410': 'KOR', '036': 'AUS', '528': 'NLD', '380': 'ITA',
  '724': 'ESP', '484': 'MEX', '076': 'BRA', '356': 'IND', '752': 'SWE',
  '756': 'CHE', '578': 'NOR', '208': 'DNK', '246': 'FIN', '056': 'BEL',
  '040': 'AUT', '616': 'POL', '620': 'PRT', '554': 'NZL', '702': 'SGP',
  '704': 'VNM', '458': 'MYS', '152': 'CHL', '604': 'PER', '170': 'COL',
  '376': 'ISR', '784': 'ARE', '682': 'SAU', '710': 'ZAF', '566': 'NGA',
  '818': 'EGY', '360': 'IDN', '764': 'THA', '608': 'PHL', '158': 'TWN',
  '344': 'HKG', '372': 'IRL',
};

export interface ComtradeMarketData {
  hsCode:           string;
  reporterCountry:  string;  // ISO alpha-3
  year:             number;
  importValueUSD:   number;
  importGrowth5y:   number | null;  // CAGR as decimal, e.g. 0.074
  sourceTag:        'UN Comtrade';
  lastVerifiedAt:   string;
}

export interface ComtradeResult {
  importValueUSD:  number;
  importGrowth5y:  number | null;
  lastVerifiedAt:  string;
}

/**
 * Get market size + 5Y growth for a specific HS code + reporter country.
 * Checks cache → Supabase trade_flows → Comtrade API.
 */
export async function getComtradeMarketData(
  hsCode: string,
  countryIso3: string,
  opts?: { supabaseOnly?: boolean }
): Promise<ComtradeResult | null> {
  const normalizedHs = hsCode.replace(/\./g, '').slice(0, 6);
  const cacheKey     = `comtrade:${normalizedHs}:${countryIso3}`;
  const cached       = await cacheGet<ComtradeMarketData>(cacheKey);

  if (cached) {
    return {
      importValueUSD: cached.importValueUSD,
      importGrowth5y: cached.importGrowth5y,
      lastVerifiedAt: cached.lastVerifiedAt,
    };
  }

  // Check Supabase trade_flows first (populated by ingest job)
  const db = createServiceClient();
  const { data: rows } = await db
    .from('trade_flows')
    .select('year, import_value_usd, last_verified_at')
    .eq('hs_code', normalizedHs)
    .eq('reporter_country', countryIso3)
    .order('year', { ascending: false })
    .limit(6);

  if (rows && rows.length > 0) {
    const latest = rows[0];
    const growth = calculateCAGR(rows);
    const result: ComtradeResult = {
      importValueUSD: latest.import_value_usd ?? 0,
      importGrowth5y: growth,
      lastVerifiedAt: latest.last_verified_at,
    };
    await cacheSet(cacheKey, { ...result, hsCode: normalizedHs, reporterCountry: countryIso3, sourceTag: 'UN Comtrade' }, TTL.COMTRADE);
    return result;
  }

  // Live API call — only if API key is configured and caller permits it
  if (!config.comtradeApiKey || opts?.supabaseOnly) return null;

  return fetchFromComtradeAPI(normalizedHs, countryIso3);
}

async function fetchFromComtradeAPI(
  hsCode: string,
  countryIso3: string
): Promise<ComtradeResult | null> {
  const currentYear  = new Date().getFullYear();
  const periods      = Array.from({ length: 5 }, (_, i) => currentYear - 1 - i).join(',');
  const reporterCode = Object.entries(COMTRADE_COUNTRY_CODES)
    .find(([, iso3]) => iso3 === countryIso3)?.[0];

  if (!reporterCode) return null;

  const url = new URL(`${COMTRADE_BASE}/C/A/HS`);
  url.searchParams.set('cmdCode',      hsCode);
  url.searchParams.set('reporterCode', reporterCode);
  url.searchParams.set('period',       periods);
  url.searchParams.set('flowCode',     'M');   // imports
  url.searchParams.set('maxRecords',   '500');
  url.searchParams.set('format',       'JSON');
  url.searchParams.set('breakdownMode','classic');
  url.searchParams.set('subscription-key', config.comtradeApiKey);

  try {
    const res = await fetch(url.toString(), {
      headers: { 'Ocp-Apim-Subscription-Key': config.comtradeApiKey },
      signal:  AbortSignal.timeout(20_000),
    });

    if (!res.ok) {
      console.warn(`[comtrade] API error ${res.status} for ${hsCode}/${countryIso3}`);
      return null;
    }

    const json = await res.json() as {
      data?: Array<{ period: string | number; primaryValue: number }>;
    };

    if (!json.data || json.data.length === 0) return null;

    // Sort by year ascending for CAGR calc
    const sorted = json.data
      .map((r) => ({ year: Number(String(r.period).slice(0, 4)), value: r.primaryValue ?? 0 }))
      .sort((a, b) => a.year - b.year);

    const latestYear  = sorted[sorted.length - 1];
    const growth      = sorted.length >= 2 ? calculateCAGRFromValues(sorted[0].value, latestYear.value, sorted.length - 1) : null;
    const now         = new Date().toISOString();
    const db          = createServiceClient();

    // Write to trade_flows for future cache hits
    for (const row of sorted) {
      await db.from('trade_flows').upsert({
        hs_code:          hsCode,
        reporter_country: countryIso3,
        year:             row.year,
        import_value_usd: row.value,
        source_name:      'UN Comtrade',
        last_verified_at: now,
        confidence_level: 'current',
      }, { onConflict: 'hs_code,reporter_country,year' });
    }

    const result: ComtradeResult = {
      importValueUSD: latestYear.value,
      importGrowth5y: growth,
      lastVerifiedAt: now,
    };

    await cacheSet(
      `comtrade:${hsCode}:${countryIso3}`,
      { ...result, hsCode, reporterCountry: countryIso3, sourceTag: 'UN Comtrade' },
      TTL.COMTRADE
    );

    return result;
  } catch (err) {
    console.error('[comtrade] fetch error:', err);
    return null;
  }
}

function calculateCAGR(rows: Array<{ year: number; import_value_usd: number | null }>): number | null {
  const sorted = rows
    .filter((r) => r.import_value_usd != null && r.import_value_usd > 0)
    .sort((a, b) => a.year - b.year);
  if (sorted.length < 2) return null;
  return calculateCAGRFromValues(sorted[0].import_value_usd!, sorted[sorted.length - 1].import_value_usd!, sorted.length - 1);
}

function calculateCAGRFromValues(start: number, end: number, years: number): number | null {
  if (start <= 0 || years <= 0) return null;
  return (end / start) ** (1 / years) - 1;
}

export function formatGrowth(cagr: number | null): string {
  if (cagr == null) return 'N/A';
  const pct = (cagr * 100).toFixed(1);
  return cagr >= 0 ? `+${pct}%` : `${pct}%`;
}

export function formatMarketSize(usd: number): string {
  if (usd >= 1e9)  return `$${(usd / 1e9).toFixed(1)}B`;
  if (usd >= 1e6)  return `$${(usd / 1e6).toFixed(0)}M`;
  if (usd >= 1e3)  return `$${(usd / 1e3).toFixed(0)}K`;
  return `$${usd}`;
}

export { COMTRADE_COUNTRY_CODES };
