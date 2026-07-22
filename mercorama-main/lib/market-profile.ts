// lib/market-profile.ts
// Deep Market Profile (DMP-1 to DMP-7) data assembler.
// All numbers from Supabase; Claude Haiku generates narrative sections only.
// Full profile cached in api_cache for 7 days.
import 'server-only';
import { createServiceClient }             from '@/lib/supabase';
import { cacheGet, cacheSet }              from '@/lib/apiCache';
import { callClaudeHaiku }                 from '@/lib/claude';
import {
  COUNTRY_RISK, LOGISTICS, REGULATORY, PROGRAMS,
  NAME_TO_ISO3, ISO3_TO_NAME,
  type CountryRisk, type LogisticsInfo, type ComplexityBand,
} from '@/lib/risk-data';

const TTL_PROFILE = 7 * 24 * 60 * 60; // 7 days

// ── Canada FTA map ─────────────────────────────────────────────────────────────
const FTA_MAP: Record<string, string> = {
  USA: 'CUSMA', MEX: 'CUSMA',
  DEU: 'CETA', FRA: 'CETA', NLD: 'CETA', BEL: 'CETA', ITA: 'CETA',
  ESP: 'CETA', PRT: 'CETA', SWE: 'CETA', DNK: 'CETA', FIN: 'CETA',
  AUT: 'CETA', POL: 'CETA', IRL: 'CETA', GBR: 'CETA',
  JPN: 'CPTPP', AUS: 'CPTPP', NZL: 'CPTPP', SGP: 'CPTPP',
  VNM: 'CPTPP', MYS: 'CPTPP', CHL: 'CPTPP/CCFTA', PER: 'CPTPP/CPEFTA',
  KOR: 'CKFTA', ISR: 'CIFTA', COL: 'CCOFTA',
};

// ── Interfaces ─────────────────────────────────────────────────────────────────

export interface MarketDemandSection {
  importValueUSD:     number | null;
  importValueYear:    number | null;
  importGrowth5y:     number | null;  // CAGR decimal
  caExportValueCAD:   number | null;
  caExportYear:       number | null;
  dataSource:         string;
}

export interface TariffSection {
  ftaAgreement:   string | null;
  ftaRate:        string;
  mfnRate:        string | null;
  notes:          string;
}

export interface RiskSection {
  band:        CountryRisk['band'];
  riskFactors: string[];
  paymentNorm: string;
  typicalDays: string;
}

export interface LogisticsSection extends LogisticsInfo {}

export interface NarrativeSection {
  channels:   string;   // Distribution channels
  cultural:   string;   // Cultural & business context
  advisory:   string;   // Strategic advisory
}

export interface DeepMarketProfile {
  hs6Code:         string;
  countryIso3:     string;
  countryName:     string;
  productLabel:    string;
  ftaAgreement:    string | null;
  demand:          MarketDemandSection;
  tariff:          TariffSection;
  risk:            RiskSection;
  logistics:       LogisticsSection | null;
  regulatory:      ComplexityBand | null;
  programs:        typeof PROGRAMS;
  narrative:       NarrativeSection;
  generatedAt:     string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatGrowthPct(g: number | null): string {
  if (g === null) return 'Unknown';
  return `${g >= 0 ? '+' : ''}${(g * 100).toFixed(1)}% CAGR (5yr)`;
}

// ── Data assembly ──────────────────────────────────────────────────────────────

async function assembleDemand(
  hs6: string,
  iso3: string,
): Promise<MarketDemandSection> {
  const db = createServiceClient();

  // trade_flows — global import demand for this HS code by this country
  const { data: tradeRows } = await db
    .from('trade_flows')
    .select('year, import_value_usd')
    .eq('hs_code', hs6)
    .eq('reporter_country', iso3)
    .eq('partner_iso3', 'WLD')
    .eq('flow_type', 'import')
    .order('year', { ascending: false })
    .limit(6);

  let importValueUSD:  number | null = null;
  let importValueYear: number | null = null;
  let importGrowth5y:  number | null = null;

  if (tradeRows && tradeRows.length >= 2) {
    const latest = tradeRows[0];
    importValueUSD  = latest.import_value_usd ?? null;
    importValueYear = latest.year;

    // CAGR over available years
    const oldest = tradeRows[tradeRows.length - 1];
    const n = latest.year - oldest.year;
    if (n > 0 && oldest.import_value_usd > 0 && importValueUSD) {
      importGrowth5y = Math.pow(importValueUSD / oldest.import_value_usd, 1 / n) - 1;
    }
  } else if (tradeRows && tradeRows.length === 1) {
    importValueUSD  = tradeRows[0].import_value_usd ?? null;
    importValueYear = tradeRows[0].year;
  }

  // statcan_exports — Canada's exports to this country for this HS6
  const { data: statcanRow } = await db
    .from('statcan_exports')
    .select('export_value_cad, year')
    .eq('hs6_code', hs6)
    .eq('province_code', 'CA')
    .eq('partner_iso3', iso3)
    .order('year', { ascending: false })
    .limit(1)
    .maybeSingle();

  const caExportValueCAD = statcanRow?.export_value_cad
    ? Number(statcanRow.export_value_cad)
    : null;
  const caExportYear = statcanRow?.year ?? null;

  const dataSources: string[] = [];
  if (importValueUSD !== null) dataSources.push('UN Comtrade');
  if (caExportValueCAD !== null) dataSources.push('Statistics Canada');

  return {
    importValueUSD,
    importValueYear,
    importGrowth5y,
    caExportValueCAD,
    caExportYear,
    dataSource: dataSources.join(' + ') || 'Pending backfill',
  };
}

async function assembleTariff(
  hs6: string,
  iso3: string,
): Promise<TariffSection> {
  const fta = FTA_MAP[iso3] ?? null;

  // For US markets, check USITC table
  if (iso3 === 'USA') {
    const db = createServiceClient();
    const { data } = await db
      .from('ustariffrates')
      .select('mfn_rate, special_rates')
      .eq('hts_code', hs6)
      .maybeSingle();

    const mfnRate = data?.mfn_rate != null ? `${data.mfn_rate}%` : null;
    const specialRates = (data?.special_rates ?? {}) as Record<string, string>;
    const caMfn = specialRates['CA'] ?? specialRates['Free'];

    return {
      ftaAgreement: 'CUSMA',
      ftaRate:      caMfn ?? 'Free (CUSMA)',
      mfnRate,
      notes: 'Canada exempt from US Section 301 tariffs under CUSMA for originating goods.',
    };
  }

  // EU/CETA countries
  if (fta === 'CETA') {
    return {
      ftaAgreement: 'CETA',
      ftaRate:      'Preferential (most goods 0%)',
      mfnRate:      null,
      notes: 'CETA provides tariff-free access for 98%+ of Canadian goods. EUR of Customs Union applies.',
    };
  }

  // CPTPP countries
  if (fta?.includes('CPTPP')) {
    return {
      ftaAgreement: fta,
      ftaRate:      'Preferential (staged reductions)',
      mfnRate:      null,
      notes: `Canada has preferential access under ${fta}. Rates depend on product category and staging schedule.`,
    };
  }

  if (fta) {
    return {
      ftaAgreement: fta,
      ftaRate:      'Preferential',
      mfnRate:      null,
      notes:        `Canada has a bilateral FTA (${fta}) providing preferential tariff access.`,
    };
  }

  return {
    ftaAgreement: null,
    ftaRate:      'MFN rates apply',
    mfnRate:      null,
    notes:        'No Canada–' + (ISO3_TO_NAME[iso3] ?? iso3) + ' FTA in force. MFN (WTO) tariff rates apply.',
  };
}

// ── Narrative generation ────────────────────────────────────────────────────────

async function generateNarrative(
  productLabel: string,
  countryName:  string,
  iso3:         string,
  demand:       MarketDemandSection,
  tariff:       TariffSection,
  risk:         RiskSection,
  logistics:    LogisticsSection | null,
): Promise<NarrativeSection> {
  const importStr = demand.importValueUSD != null
    ? `USD ${(demand.importValueUSD / 1e6).toFixed(1)}M (${demand.importValueYear}), growth ${formatGrowthPct(demand.importGrowth5y)}`
    : 'data pending';
  const caExportStr = demand.caExportValueCAD != null
    ? `CAD ${(demand.caExportValueCAD / 1e6).toFixed(1)}M (${demand.caExportYear})`
    : 'data pending';

  const prompt = `You are a senior Canadian trade advisor. Write three short, practical narrative sections for a Canadian SME considering exporting "${productLabel}" to ${countryName} (${iso3}).

DATA CONTEXT:
- Market import demand: ${importStr}
- Canada's current exports of this product to ${countryName}: ${caExportStr}
- FTA access: ${tariff.ftaAgreement ?? 'None'} — ${tariff.ftaRate}
- Market risk band: ${risk.band}
- Payment norm: ${risk.paymentNorm}
- Logistics: ${logistics ? logistics.route + ', ' + logistics.transitDays : 'data unavailable'}

Write exactly three sections in this JSON format:
{
  "channels": "2–3 sentence practical description of typical distribution channels and how Canadian suppliers typically enter the ${countryName} market for this type of product.",
  "cultural": "2–3 sentence note on key cultural or business norms relevant to Canadian exporters selling to ${countryName} buyers.",
  "advisory": "2–3 sentence strategic recommendation for a Canadian SME entering ${countryName} with this product — specific, actionable, not generic."
}

Output only valid JSON. No preamble, no explanation.`;

  try {
    const raw = await callClaudeHaiku(prompt);
    const jsonStr = raw.trim().replace(/^```json\s*|```$/g, '');
    const parsed = JSON.parse(jsonStr) as NarrativeSection;
    return parsed;
  } catch {
    return {
      channels:  `Distribution in ${countryName} typically involves specialist importers or distributors. Direct e-commerce channels may be viable for B2C products. Trade Commissioner Service contacts can facilitate introductions.`,
      cultural:  `${countryName} buyers expect professional documentation and consistent quality. Building relationships over multiple interactions before closing deals is common. Ensure all labels and certifications meet local standards.`,
      advisory:  `Start with a market entry assessment through the Trade Commissioner Service office in ${countryName}. Secure export credit insurance from EDC before extending open-account terms. Target distributors with existing networks in your product category.`,
    };
  }
}

// ── Main assembler ─────────────────────────────────────────────────────────────

export async function getDeepMarketProfile(
  hs6Code:      string,
  countryInput: string,    // ISO3 or country name
  productLabel: string,
): Promise<DeepMarketProfile> {
  // Normalise to ISO3
  const iso3 = NAME_TO_ISO3[countryInput] ?? countryInput.toUpperCase().slice(0, 3);
  const countryName = ISO3_TO_NAME[iso3] ?? countryInput;
  const hs6 = hs6Code.replace(/\./g, '').slice(0, 6);

  const cacheKey = `dmp:${hs6}:${iso3}`;
  const cached = await cacheGet<DeepMarketProfile>(cacheKey);
  if (cached) return cached;

  // Assemble numeric sections in parallel
  const [demand, tariff] = await Promise.all([
    assembleDemand(hs6, iso3),
    assembleTariff(hs6, iso3),
  ]);

  const riskData   = COUNTRY_RISK[iso3] ?? { band: 'Medium' as const, riskFactors: [], paymentNorm: 'Letter of credit', typicalDays: '60–90 days' };
  const logistics  = LOGISTICS[iso3]   ?? null;
  const regulatory = REGULATORY[iso3]  ?? null;

  const risk: RiskSection = {
    band:        riskData.band,
    riskFactors: riskData.riskFactors,
    paymentNorm: riskData.paymentNorm,
    typicalDays: riskData.typicalDays,
  };

  // Generate narrative (Claude Haiku)
  const narrative = await generateNarrative(productLabel, countryName, iso3, demand, tariff, risk, logistics);

  const profile: DeepMarketProfile = {
    hs6Code:      hs6,
    countryIso3:  iso3,
    countryName,
    productLabel,
    ftaAgreement: FTA_MAP[iso3] ?? null,
    demand,
    tariff,
    risk,
    logistics,
    regulatory,
    programs: PROGRAMS,
    narrative,
    generatedAt: new Date().toISOString(),
  };

  await cacheSet(cacheKey, profile, TTL_PROFILE);
  return profile;
}
