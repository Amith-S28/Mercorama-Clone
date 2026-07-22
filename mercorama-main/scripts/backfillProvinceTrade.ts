#!/usr/bin/env tsx
// scripts/backfillProvinceTrade.ts
// Province-by-province trade data backfill.
//
// Usage (run from project root):
//   npx tsx scripts/backfillProvinceTrade.ts --province=NS
//
// Requirements:
//   - .env must contain NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, COMTRADE_API_KEY
//   - Run: npm install -D tsx (if not already installed)
//   - Respects 450 Comtrade calls/day cap (persisted in comtrade_quota table)
//
// Day schedule:
//   Day 1: --province=NS  (Nova Scotia)
//   Day 2: --province=NB  (New Brunswick)
//   Day 3: --province=PE  (PEI)
//   Day 4: --province=NL  (Newfoundland)
//   Day 5: --province=QC  (Quebec)
//   Day 6: --province=ON  (Ontario)
//   Day 7: --province=MB  (Manitoba)
//   Day 8: --province=SK  (Saskatchewan)
//   Day 9: --province=AB  (Alberta)
//   Day 10: --province=BC (British Columbia)

import { readFileSync } from 'fs';
import { join }         from 'path';
import { createClient } from '@supabase/supabase-js';

// ── Load .env from project root ────────────────────────────────────────────────
function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env');
    const lines   = readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (key && !process.env[key]) process.env[key] = val;
    }
  } catch {
    console.warn('[backfill] Could not load .env — using process environment');
  }
}
loadEnv();

// ── Config ─────────────────────────────────────────────────────────────────────
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const COMTRADE_KEY  = process.env.COMTRADE_API_KEY ?? '';
const DAILY_CAP     = 450;
const COMTRADE_BASE = 'https://comtradeapi.un.org/data/v1/get';
const CAD_TO_USD    = 0.74;
const LAST_N_YEARS  = 5;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('[backfill] NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY);

// ── Target countries (same 40 as comtrade-sync cron) ──────────────────────────
const TARGET_COUNTRIES = [
  'USA','GBR','DEU','FRA','JPN','CHN','KOR','AUS','NLD','ITA',
  'ESP','MEX','BRA','IND','SWE','CHE','NOR','DNK','FIN','BEL',
  'AUT','POL','PRT','NZL','SGP','VNM','MYS','CHL','PER','COL',
  'ISR','ARE','SAU','ZAF','NGA','EGY','IDN','THA','PHL','TWN',
];

const ISO3_TO_NUMERIC: Record<string, string> = {
  USA: '842', GBR: '826', DEU: '276', FRA: '250', JPN: '392',
  CHN: '156', KOR: '410', AUS: '036', NLD: '528', ITA: '380',
  ESP: '724', MEX: '484', BRA: '076', IND: '356', SWE: '752',
  CHE: '756', NOR: '578', DNK: '208', FIN: '246', BEL: '056',
  AUT: '040', POL: '616', PRT: '620', NZL: '554', SGP: '702',
  VNM: '704', MYS: '458', CHL: '152', PER: '604', COL: '170',
  ISR: '376', ARE: '784', SAU: '682', ZAF: '710', NGA: '566',
  EGY: '818', IDN: '360', THA: '764', PHL: '608', TWN: '158',
};

// ── Parse CLI args ─────────────────────────────────────────────────────────────
const args        = Object.fromEntries(process.argv.slice(2).map((a) => a.replace('--', '').split('=')));
const PROVINCE    = (args.province ?? '').toUpperCase();
const DRY_RUN     = args['dry-run'] === 'true';

if (!PROVINCE) {
  console.error('Usage: npx tsx scripts/backfillProvinceTrade.ts --province=NS [--dry-run=true]');
  process.exit(1);
}

// ── Quota helpers ──────────────────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10);

async function getCallsToday(): Promise<number> {
  const { data } = await db.from('comtrade_quota').select('calls_made').eq('date', today).maybeSingle();
  return data?.calls_made ?? 0;
}

async function incrementQuota(): Promise<void> {
  const current = await getCallsToday();
  await db.from('comtrade_quota').upsert({ date: today, calls_made: current + 1 }, { onConflict: 'date' });
}

// ── Comtrade fetch (live, with quota guard) ────────────────────────────────────
async function fetchComtradeForHs6(hs6: string, reporterIso3: string): Promise<boolean> {
  const calls = await getCallsToday();
  if (calls >= DAILY_CAP) {
    console.warn(`  [quota] ${calls}/${DAILY_CAP} reached — skipping ${hs6}/${reporterIso3}`);
    return false;
  }
  if (!COMTRADE_KEY) {
    console.warn(`  [comtrade] No COMTRADE_API_KEY — skipping live fetch`);
    return false;
  }

  const reporterCode = ISO3_TO_NUMERIC[reporterIso3];
  if (!reporterCode) return false;

  const currentYear = new Date().getFullYear();
  const periods     = Array.from({ length: LAST_N_YEARS }, (_, i) => currentYear - 1 - i).join(',');
  const url         = new URL(`${COMTRADE_BASE}/C/A/HS`);
  url.searchParams.set('cmdCode',      hs6);
  url.searchParams.set('reporterCode', reporterCode);
  url.searchParams.set('period',       periods);
  url.searchParams.set('flowCode',     'M');
  url.searchParams.set('maxRecords',   '500');
  url.searchParams.set('format',       'JSON');
  url.searchParams.set('breakdownMode','classic');
  url.searchParams.set('subscription-key', COMTRADE_KEY);

  try {
    const res = await fetch(url.toString(), {
      headers: { 'Ocp-Apim-Subscription-Key': COMTRADE_KEY },
      signal:  AbortSignal.timeout(20_000),
    });

    await incrementQuota();

    if (!res.ok) {
      console.warn(`  [comtrade] API ${res.status} for ${hs6}/${reporterIso3}`);
      return false;
    }

    const json = await res.json() as {
      data?: Array<{ period: string | number; primaryValue: number }>;
    };

    if (!json.data || json.data.length === 0) return false;

    const now = new Date().toISOString();
    for (const entry of json.data) {
      const year  = Number(String(entry.period).slice(0, 4));
      const value = entry.primaryValue ?? 0;

      if (!DRY_RUN) {
        await db.from('trade_flows').upsert({
          hs_code:          hs6,
          reporter_country: reporterIso3,
          partner_iso3:     'WLD',
          flow_type:        'import',
          year,
          import_value_usd: value,
          source_name:      'UN Comtrade',
          data_source:      'UN Comtrade',
          hs_version:       'HS 2022',
          last_verified_at: now,
          confidence_level: 'current',
        }, { onConflict: 'hs_code,reporter_country,partner_iso3,year,flow_type' });
      }
    }

    return true;
  } catch (err) {
    console.error(`  [comtrade] fetch error ${hs6}/${reporterIso3}:`, err);
    return false;
  }
}

// ── StatCan placeholder (populates statcan_exports with 0 until CSV parse) ─────
// StatCan's bulk download API is HTML-based and complex.
// This writes placeholder rows flagged for re-sync once CSV download is implemented.
async function fetchStatcanForHs6(hs6: string, province: string): Promise<void> {
  if (!COMTRADE_KEY && !SUPABASE_URL) return; // sanity

  const currentYear = new Date().getFullYear();
  const now         = new Date().toISOString();

  for (const partnerIso3 of TARGET_COUNTRIES) {
    for (let i = 0; i < LAST_N_YEARS; i++) {
      const year = currentYear - 1 - i;

      // Check if row exists
      const { data: existing } = await db
        .from('statcan_exports')
        .select('id')
        .eq('hs6_code', hs6)
        .eq('province_code', province)
        .eq('partner_iso3', partnerIso3)
        .eq('year', year)
        .maybeSingle();

      if (existing) continue; // already synced

      if (!DRY_RUN) {
        // Write placeholder row — value = 0 (will be updated when StatCan CSV parse is implemented)
        await db.from('statcan_exports').upsert({
          hs6_code:         hs6,
          province_code:    province,
          partner_iso3:     partnerIso3,
          year,
          export_value_cad: 0, // placeholder
          source:           'Statistics Canada (pending)',
          last_synced_at:   now,
        }, { onConflict: 'hs6_code,province_code,partner_iso3,year' });
      }
    }
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n[backfill] Starting province=${PROVINCE} dry-run=${DRY_RUN}`);

  // 1 — Get HS6 codes for province
  const { data: products, error } = await db
    .from('province_products')
    .select('product_name, hs6_codes')
    .eq('province_code', PROVINCE)
    .not('hs6_codes', 'is', null);

  if (error || !products?.length) {
    console.error(`[backfill] No province_products found for province=${PROVINCE}`);
    process.exit(1);
  }

  const hs6Set = new Set<string>();
  for (const p of products) {
    for (const code of (p.hs6_codes as string[] ?? [])) hs6Set.add(code);
  }
  const hs6List = [...hs6Set];

  console.log(`[backfill] Province ${PROVINCE}: ${products.length} products, ${hs6List.length} HS6 codes`);
  console.log(`[backfill] HS6 codes: ${hs6List.join(', ')}`);

  // 2 — StatCan pass (no quota concern)
  console.log('\n[backfill] Phase 1: StatCan exports →');
  for (const hs6 of hs6List) {
    console.log(`  StatCan ${hs6} / ${PROVINCE} ...`);
    await fetchStatcanForHs6(hs6, PROVINCE);
  }

  // 3 — Comtrade pass (quota-controlled)
  console.log('\n[backfill] Phase 2: Comtrade import demand →');
  let comtradeFetched = 0, comtradeSkipped = 0;

  for (const hs6 of hs6List) {
    for (const iso3 of TARGET_COUNTRIES) {
      // Check if trade_flows already has data
      const { data: existing } = await db
        .from('trade_flows')
        .select('id')
        .eq('hs_code', hs6)
        .eq('reporter_country', iso3)
        .eq('partner_iso3', 'WLD')
        .eq('flow_type', 'import')
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`  [skip] ${hs6}/${iso3} already in trade_flows`);
        comtradeSkipped++;
        continue;
      }

      const calls = await getCallsToday();
      if (calls >= DAILY_CAP) {
        console.warn(`\n[backfill] Daily Comtrade cap (${DAILY_CAP}) reached. Resume tomorrow.`);
        break;
      }

      console.log(`  Comtrade ${hs6}/${iso3} (${calls + 1}/${DAILY_CAP}) ...`);
      const ok = await fetchComtradeForHs6(hs6, iso3);
      if (ok) comtradeFetched++;

      // Respect API rate limit
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  // 4 — Summary
  const finalCalls = await getCallsToday();
  console.log(`
[backfill] Complete — province=${PROVINCE}
  Comtrade calls today: ${finalCalls}/${DAILY_CAP}
  New Comtrade fetches: ${comtradeFetched}
  Already cached:       ${comtradeSkipped}
  StatCan rows:         written (placeholder — pending CSV parse)
  Dry run:              ${DRY_RUN}
`);
}

main().catch((err) => {
  console.error('[backfill] Fatal error:', err);
  process.exit(1);
});
