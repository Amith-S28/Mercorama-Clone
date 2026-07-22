// app/api/cron/comtrade-sync/route.ts
// UN Comtrade monthly sync — batch or single HS code.
// Rate limit: 500 calls/day on free tier — each HS × country = 1 call.
// Batch mode: syncs all PRIORITY_HS_CODES × top 10 countries = ~200 calls.
// Single mode: ?hs_code=XXXXXX syncs one HS code × 40 countries.
import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { getComtradeMarketData, COMTRADE_COUNTRY_CODES } from '@/lib/comtrade';
import { createServiceClient } from '@/lib/supabase';

export const runtime  = 'nodejs';
export const maxDuration = 300;

// Canada's top 73 export HS codes (6-digit, 2024 data, validated Apr 2026)
// HS codes are static reference data — only trade flow VALUES need monthly refresh.
const PRIORITY_HS_CODES = [
  // Ch.27 Mineral Fuels (~$145B)
  '270900','271121','271012','271019','271119','270112','271311','271600',
  // Ch.87 Vehicles (~$61B) — includes HS 2022 EV subheadings
  '870323','870324','870322','870360','870370','870380','870840','870829','870431','870421','870899',
  // Ch.71 Precious Metals (~$34B)
  '710812','710813','711011','710231',
  // Ch.84 Machinery (~$41B)
  '841182','847989','848180','843143','842952','841391',
  // Ch.84+88 Aerospace (~$13B)
  '841191','880240','880230','880330',
  // Ch.10,12,15,19 Agriculture & Food
  '100199','100119','120510','151419','151211','190590','030389','030617',
  // Ch.31 Fertilizers
  '310420','310210','310520',
  // Ch.44,47 Wood & Pulp (~$13.5B)
  '440710','440311','470321','480411','441233',
  // Ch.76,74,26 Metals & Ores (~$24B)
  '760110','760120','760410','260111','260300','262011','740200','740311',
  // Ch.30,39,28 Pharma & Chemicals
  '300490','300215','390720','390110','390210','281410',
  // Ch.85 Electrical (~$17.5B)
  '854442','853710','850440','851762','853650',
  // Other
  '261690','720410','720711','480100','284420','480255',
];

// Top 15 Canadian export destination countries
const TOP_DESTINATIONS = [
  'USA','CHN','GBR','JPN','MEX','KOR','NLD','DEU','CHE','IND',
  'BEL','FRA','AUS','BRA','IDN',
];

export async function GET(req: NextRequest) {
  const auth = req.headers.get('x-cron-secret');
  if (config.cronSecret && auth !== config.cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!config.comtradeApiKey) {
    return NextResponse.json({
      error: 'COMTRADE_API_KEY not configured. Register at comtradeapi.un.org to get a free key (500 calls/day).',
    }, { status: 503 });
  }

  const singleHsCode = req.nextUrl.searchParams.get('hs_code');
  const quick = req.nextUrl.searchParams.get('quick') === '1';
  const day = req.nextUrl.searchParams.get('day'); // '1', '2', '3' for chunked daily runs
  const now = new Date().toISOString();
  const t0 = Date.now();

  // Single HS code mode (backward compatible)
  if (singleHsCode) {
    return syncSingleCode(singleHsCode, now);
  }

  // Chunked daily mode: split 70 codes into 3 days (~23 codes each × 15 countries)
  // Day 1: codes 0-22 (energy, vehicles) = 345 calls
  // Day 2: codes 23-45 (metals, aerospace, agriculture, wood) = 345 calls
  // Day 3: codes 46-69 (pharma, electrical, other) = 360 calls
  let codes: string[];
  let destinations: string[];
  let mode: string;

  if (day === '1') {
    codes = PRIORITY_HS_CODES.slice(0, 23);
    destinations = TOP_DESTINATIONS;
    mode = 'day-1';
  } else if (day === '2') {
    codes = PRIORITY_HS_CODES.slice(23, 46);
    destinations = TOP_DESTINATIONS;
    mode = 'day-2';
  } else if (day === '3') {
    codes = PRIORITY_HS_CODES.slice(46);
    destinations = TOP_DESTINATIONS;
    mode = 'day-3';
  } else if (quick) {
    codes = PRIORITY_HS_CODES.slice(0, 5);
    destinations = TOP_DESTINATIONS.slice(0, 5);
    mode = 'quick';
  } else {
    // Legacy full mode — will hit rate limits, use day param instead
    codes = PRIORITY_HS_CODES;
    destinations = TOP_DESTINATIONS;
    mode = 'full';
  }

  // Batch mode
  const results: { hs_code: string; fetched: number; errors: number }[] = [];
  let totalFetched = 0;
  let totalErrors = 0;

  for (const hsCode of codes) {
    let fetched = 0;
    let errors = 0;

    for (const iso3 of destinations) {
      try {
        await getComtradeMarketData(hsCode, iso3);
        fetched++;
        totalFetched++;
        // Rate limiting: 250ms between calls = max 240 calls/min
        await new Promise((r) => setTimeout(r, 250));
      } catch {
        errors++;
        totalErrors++;
      }
    }

    results.push({ hs_code: hsCode, fetched, errors });
  }

  const duration = Date.now() - t0;

  // Log to admin changelog
  const db = createServiceClient();
  await db.from('admin_changelog').insert({
    entry_type:      'rate_update',
    title:           `UN Comtrade ${mode} sync — ${codes.length} HS codes × ${destinations.length} countries`,
    description:     `Fetched: ${totalFetched}, Errors: ${totalErrors}, Duration: ${(duration / 1000).toFixed(0)}s`,
    affected_tables: ['trade_flows'],
    created_by:      'cron',
    severity:        'low',
  }).then(null, () => {});

  console.log(`[mercorama] comtrade-sync batch: ${totalFetched} fetched, ${totalErrors} errors in ${(duration / 1000).toFixed(0)}s`);

  return NextResponse.json({
    ran_at: now,
    mode,
    hs_codes: codes.length,
    destinations: destinations.length,
    total_fetched: totalFetched,
    total_errors: totalErrors,
    duration_ms: duration,
    results,
  });
}

// Single HS code sync (original behavior)
async function syncSingleCode(hsCode: string, now: string) {
  let fetched = 0;
  const errors: string[] = [];
  const iso3Codes = [...new Set(Object.values(COMTRADE_COUNTRY_CODES))];
  const TARGET_COUNTRIES = iso3Codes.slice(0, 40);

  for (const iso3 of TARGET_COUNTRIES) {
    try {
      await getComtradeMarketData(hsCode, iso3);
      fetched++;
      await new Promise((r) => setTimeout(r, 250));
    } catch (err) {
      errors.push(`${iso3}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const db = createServiceClient();
  await db.from('admin_changelog').insert({
    entry_type:      'rate_update',
    title:           `UN Comtrade sync — HS ${hsCode} — ${fetched} markets fetched`,
    description:     errors.length ? `Errors: ${errors.slice(0, 5).join('; ')}` : 'Completed without errors.',
    affected_tables: ['trade_flows'],
    created_by:      'cron',
    severity:        'low',
  }).then(null, () => {});

  return NextResponse.json({ ran_at: now, mode: 'single', hs_code: hsCode, fetched, errors: errors.slice(0, 10) });
}
