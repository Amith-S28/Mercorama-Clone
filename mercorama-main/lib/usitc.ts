// lib/usitc.ts
// TE-2.1 — USITC HTS tariff connector.
// Queries USITC REST API for MFN + special rates per HTS code.
// Nightly ingest via /api/cron/usitc-ingest.
// API docs: https://hts.usitc.gov/reststop/
import 'server-only';
import { createServiceClient } from '@/lib/supabase';
import { cacheGet, cacheSet, TTL } from '@/lib/apiCache';

const USITC_BASE = 'https://hts.usitc.gov/reststop/api';

// FTA program codes used in USITC special rates
const FTA_PROGRAM_MAP: Record<string, string> = {
  CA:  'CUSMA',  MX:  'CUSMA', AU:  'AUSFTA',  BH:  'BFTA',
  CL:  'CFTA',   CO:  'COFTA', D:   'AGOA',    E:   'CBERA',
  IL:  'ILFTA',  J:   'JFTA',  JO:  'JOFTA',   KR:  'KFTA',
  MA:  'MAFTA',  OM:  'OMFTA', P:   'PFTA',     PA:  'PAFTA',
  PE:  'PEFTA',  SG:  'SGFTA',
};

export interface USITCRateResult {
  htsCode:          string;
  mfnRate:          number | null;  // percent, e.g. 6.5
  mfnRateStr:       string;         // e.g. "6.5%" or "Free"
  specialRates:     Record<string, string>;
  additionalDuties: Record<string, string>;
  sourceTag:        'USITC HTS';
  lastVerifiedAt:   string;
}

/**
 * Get tariff rate for a given HTS code.
 * For non-US markets, returns null (CBSA used for CA rates — future TE-2.2).
 * Check cache → Supabase ustariffrates → USITC API.
 */
export async function getUSITCRate(htsCode: string): Promise<USITCRateResult | null> {
  const normalized = htsCode.replace(/\./g, '').slice(0, 10);
  const cacheKey   = `usitc:${normalized}`;
  const cached     = await cacheGet<USITCRateResult>(cacheKey);
  if (cached) return cached;

  // Check Supabase ustariffrates
  const db = createServiceClient();
  const { data } = await db
    .from('ustariffrates')
    .select('mfn_rate, special_rates, additional_duties, last_verified_at')
    .eq('hts_code', normalized)
    .maybeSingle();

  if (data?.mfn_rate != null) {
    const result: USITCRateResult = {
      htsCode:          normalized,
      mfnRate:          data.mfn_rate,
      mfnRateStr:       formatRate(data.mfn_rate),
      specialRates:     (data.special_rates as Record<string, string>) ?? {},
      additionalDuties: (data.additional_duties as Record<string, string>) ?? {},
      sourceTag:        'USITC HTS',
      lastVerifiedAt:   data.last_verified_at,
    };
    await cacheSet(cacheKey, result, TTL.USITC);
    return result;
  }

  // Live API call
  return fetchFromUSITC(normalized);
}

async function fetchFromUSITC(htsCode: string): Promise<USITCRateResult | null> {
  // Format for USITC API: dots required, e.g. "8471.30.01.00"
  const dotFormatted = formatHTSWithDots(htsCode);

  try {
    const res = await fetch(
      `${USITC_BASE}/details/en/${encodeURIComponent(dotFormatted)}`,
      {
        headers: { 'Accept': 'application/json' },
        signal:  AbortSignal.timeout(10_000),
      }
    );

    if (!res.ok) {
      console.warn(`[usitc] API error ${res.status} for ${htsCode}`);
      return null;
    }

    const json = await res.json() as {
      htsno?:        string;
      description?:  string;
      general?:      string;   // MFN rate, e.g. "6.5%" or "Free"
      special?:      string;   // special rate string, e.g. "Free (A,AU,BH,...)"
      other?:        string;
      indent?:       string;
    };

    const mfnRate    = parseRatePercent(json.general ?? '');
    const special    = parseSpecialRates(json.special ?? '');
    const now        = new Date().toISOString();

    const result: USITCRateResult = {
      htsCode:          htsCode,
      mfnRate,
      mfnRateStr:       json.general ?? 'N/A',
      specialRates:     special,
      additionalDuties: {},
      sourceTag:        'USITC HTS',
      lastVerifiedAt:   now,
    };

    // Write to Supabase
    const db = createServiceClient();
    await db.from('ustariffrates').upsert({
      hts_code:         htsCode,
      description:      json.description ?? '',
      mfn_rate:         mfnRate,
      special_rates:    special,
      additional_duties: {},
      source_name:      'USITC HTS',
      last_verified_at: now,
      confidence_level: 'verified',
    }, { onConflict: 'hts_code' });

    await cacheSet(`usitc:${htsCode}`, result, TTL.USITC);
    return result;

  } catch (err) {
    console.error('[usitc] fetch error:', err);
    return null;
  }
}

/**
 * Get effective tariff rate for a market, checking FTA rates first.
 * Returns { rate, ftaName } — e.g. { rate: "0%", ftaName: "CUSMA" }
 */
export function getEffectiveRate(
  usitcResult: USITCRateResult | null,
  ftaName: string | null
): { rateStr: string; fromFTA: boolean } {
  if (!usitcResult) return { rateStr: 'N/A', fromFTA: false };

  // Check if FTA gives a better rate
  if (ftaName && usitcResult.specialRates) {
    const ftaCode = Object.entries(FTA_PROGRAM_MAP).find(([, name]) => name === ftaName)?.[0];
    if (ftaCode && usitcResult.specialRates[ftaCode]) {
      return { rateStr: usitcResult.specialRates[ftaCode], fromFTA: true };
    }
    // CUSMA covers both CA and MX
    if (ftaName === 'CUSMA' && (usitcResult.specialRates['CA'] || usitcResult.specialRates['MX'])) {
      return { rateStr: usitcResult.specialRates['CA'] ?? usitcResult.specialRates['MX'] ?? 'Free', fromFTA: true };
    }
  }

  return { rateStr: usitcResult.mfnRateStr, fromFTA: false };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseRatePercent(rateStr: string): number | null {
  if (!rateStr || rateStr === 'Free') return 0;
  const match = rateStr.match(/(\d+\.?\d*)\s*%/);
  return match ? parseFloat(match[1]) : null;
}

function parseSpecialRates(specialStr: string): Record<string, string> {
  // Format: "Free (A,AU,BH,CA,CL,CO,...)" or "2.5% (MX)" etc.
  const result: Record<string, string> = {};
  const match = specialStr.match(/^([^(]+)\(([^)]+)\)/);
  if (!match) return result;

  const rateVal = match[1].trim();
  const codes   = match[2].split(',').map((c) => c.trim());
  for (const code of codes) {
    result[code] = rateVal;
  }
  return result;
}

function formatRate(pct: number | null): string {
  if (pct === null) return 'N/A';
  if (pct === 0)    return 'Free';
  return `${pct}%`;
}

function formatHTSWithDots(code: string): string {
  const c = code.replace(/\./g, '');
  if (c.length <= 4)  return c;
  if (c.length <= 6)  return `${c.slice(0, 4)}.${c.slice(4)}`;
  if (c.length <= 8)  return `${c.slice(0, 4)}.${c.slice(4, 6)}.${c.slice(6)}`;
  return `${c.slice(0, 4)}.${c.slice(4, 6)}.${c.slice(6, 8)}.${c.slice(8)}`;
}
