// app/api/cron/province-backfill/route.ts
// Province trade data backfill — calls getComtradeImports with full quota logic.
// One province per day. Respects 450 Comtrade calls/day.
//
// Hetzner crontab (rotate provinces):
// 0 5 * * 1 curl -s -H "x-cron-secret: $CRON_SECRET" "http://localhost:3000/api/cron/province-backfill?province=NS"
// 0 5 * * 2 curl -s -H "x-cron-secret: $CRON_SECRET" "http://localhost:3000/api/cron/province-backfill?province=NB"
// ... etc.
import { NextRequest, NextResponse } from 'next/server';
import { config }                    from '@/lib/config';
import { createServiceClient }       from '@/lib/supabase';
import { getComtradeImports, getComtradeCallsToday } from '@/lib/comtrade-imports';

export const runtime    = 'nodejs';
export const maxDuration = 300;

const TARGET_COUNTRIES = [
  'USA','GBR','DEU','FRA','JPN','CHN','KOR','AUS','NLD','ITA',
  'ESP','MEX','BRA','IND','SWE','CHE','NOR','DNK','FIN','BEL',
  'AUT','POL','PRT','NZL','SGP','VNM','MYS','CHL','PER','COL',
  'ISR','ARE','SAU','ZAF','NGA','EGY','IDN','THA','PHL','TWN',
];

export async function GET(req: NextRequest) {
  const auth = req.headers.get('x-cron-secret');
  if (config.cronSecret && auth !== config.cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const province = req.nextUrl.searchParams.get('province')?.toUpperCase();
  if (!province) return NextResponse.json({ error: 'province required' }, { status: 400 });

  const db  = createServiceClient();
  const now = new Date().toISOString();

  // Get HS6 codes for province
  const { data: products } = await db
    .from('province_products')
    .select('product_name, hs6_codes')
    .eq('province_code', province)
    .not('hs6_codes', 'is', null);

  if (!products?.length) {
    return NextResponse.json({ error: `No products found for province=${province}` }, { status: 404 });
  }

  const hs6Set = new Set<string>();
  for (const p of products) {
    for (const code of (p.hs6_codes as string[] ?? [])) hs6Set.add(code);
  }
  const hs6List = [...hs6Set];

  let fetched = 0, skipped = 0;
  const errors: string[] = [];

  for (const hs6 of hs6List) {
    for (const iso3 of TARGET_COUNTRIES) {
      const calls = await getComtradeCallsToday();
      if (calls >= 450) {
        errors.push(`Daily cap reached at ${calls} calls — remaining HS6/countries deferred`);
        break;
      }

      try {
        const rows = await getComtradeImports(hs6, iso3, true);
        if (rows === null) { skipped++; continue; }
        fetched++;
        await new Promise((r) => setTimeout(r, 250)); // rate limit
      } catch (err) {
        errors.push(`${hs6}/${iso3}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  // Log to admin_changelog
  await db.from('admin_changelog').insert({
    entry_type:      'rate_update',
    title:           `Province backfill — ${province} — ${fetched} Comtrade fetches`,
    description:     errors.length ? `Errors: ${errors.slice(0, 5).join('; ')}` : 'Completed without errors.',
    affected_tables: ['trade_flows', 'statcan_exports'],
    created_by:      'cron',
    severity:        errors.length > 0 ? 'medium' : 'low',
  }).then(null, () => {});

  const callsToday = await getComtradeCallsToday();
  return NextResponse.json({ ran_at: now, province, hs6_count: hs6List.length, fetched, skipped, calls_today: callsToday, errors: errors.slice(0, 10) });
}
