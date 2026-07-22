// app/api/cron/usitc-ingest/route.ts
// TE-2.1 — USITC nightly HTS ingest (runs 02:00 UTC via Hetzner crontab).
// Fetches full HTS schedule, diffs against prior snapshot, writes tariffchanges.
//
// Hetzner crontab entry:
// 0 2 * * * curl -s -H "x-cron-secret: $CRON_SECRET" https://mercorama.com/api/cron/usitc-ingest
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { config } from '@/lib/config';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 min — full schedule fetch can be slow

// USITC HTS API — the JSON search endpoint works reliably
const USITC_SEARCH_URL = 'https://hts.usitc.gov/reststop/search';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('x-cron-secret');
  if (config.cronSecret && auth !== config.cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db     = createServiceClient();
  const now    = new Date().toISOString();
  let inserted = 0, updated = 0, changes = 0;
  const errors: string[] = [];

  const quick = req.nextUrl.searchParams.get('quick') === '1';
  // All chapters relevant to Canada's top 70 export HS codes
  const ALL_CHAPTERS = ['03','10','12','15','19','26','27','28','30','31','39','44','47','48','71','72','74','76','84','85','87','88'];
  const CHAPTERS = quick ? ALL_CHAPTERS.slice(0, 5) : ALL_CHAPTERS;

  try {
    let rows: Array<{ htsno: string; description: string; general: string; special: string }> = [];

    for (const chapter of CHAPTERS) {
      try {
        const res = await fetch(`${USITC_SEARCH_URL}?query=${chapter}`, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) { errors.push(`Chapter ${chapter}: HTTP ${res.status}`); continue; }
        const data = await res.json();
        if (Array.isArray(data)) {
          rows.push(...data.map((r: Record<string, string>) => ({
            htsno: r.htsno ?? r.htsNo ?? '',
            description: r.description ?? r.brief_description ?? '',
            general: r.general ?? '',
            special: r.special ?? '',
          })));
        }
      } catch (err) {
        errors.push(`Chapter ${chapter}: ${err instanceof Error ? err.message : 'failed'}`);
      }
      // Rate limit
      await new Promise((r) => setTimeout(r, 500));
    }

    if (rows.length === 0 && errors.length > 0) {
      return NextResponse.json({ ran_at: now, error: 'No data fetched', errors }, { status: 502 });
    }

    // Process in batches of 100 to avoid Supabase payload limits
    const BATCH = 100;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);

      for (const row of batch) {
        const htsCode  = row.htsno.replace(/\./g, '').slice(0, 10);
        if (!htsCode) continue;

        const mfnRaw   = row.general?.trim();
        const mfnRate  = parseMFNRate(mfnRaw);
        const special  = parseSpecialRates(row.special ?? '');

        // Read prior value to detect changes
        const { data: prior } = await db
          .from('ustariffrates')
          .select('mfn_rate, special_rates')
          .eq('hts_code', htsCode)
          .maybeSingle();

        const { error } = await db
          .from('ustariffrates')
          .upsert({
            hts_code:         htsCode,
            description:      row.description ?? '',
            mfn_rate:         mfnRate,
            special_rates:    special,
            additional_duties: {},
            source_name:      'USITC HTS',
            last_verified_at: now,
            confidence_level: 'verified',
          }, { onConflict: 'hts_code' });

        if (error) { errors.push(`upsert ${htsCode}: ${error.message}`); continue; }
        prior ? updated++ : inserted++;

        // Write tariffchanges diff
        if (prior) {
          if (prior.mfn_rate !== mfnRate) {
            await db.from('tariffchanges').insert({
              hts_code:         htsCode,
              field_name:       'mfn_rate',
              old_value:        String(prior.mfn_rate ?? ''),
              new_value:        String(mfnRate ?? ''),
              source_name:      'USITC HTS',
              last_verified_at: now,
              confidence_level: 'verified',
            });
            changes++;
          }
        }
      }
    }

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[usitc-ingest] fatal:', msg);
    errors.push(msg);
  }

  // Write changelog entry
  await db.from('admin_changelog').insert({
    entry_type:      'rate_update',
    title:           `USITC nightly ingest — ${inserted} new, ${updated} updated, ${changes} rate changes`,
    description:     errors.length ? `Errors: ${errors.join('; ')}` : 'Completed without errors.',
    affected_tables: ['ustariffrates', 'tariffchanges'],
    created_by:      'cron',
    severity:        errors.length > 0 ? 'medium' : 'low',
  }).then(null, () => {});

  return NextResponse.json({ ran_at: now, inserted, updated, changes, errors });
}

function parseMFNRate(raw: string | undefined): number | null {
  if (!raw || raw.toLowerCase() === 'free') return 0;
  const m = (raw ?? '').match(/(\d+\.?\d*)\s*%/);
  return m ? parseFloat(m[1]) : null;
}

function parseSpecialRates(specialStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  const match = specialStr.match(/^([^(]+)\(([^)]+)\)/);
  if (!match) return result;
  const rateVal = match[1].trim();
  for (const code of match[2].split(',').map((c) => c.trim())) {
    result[code] = rateVal;
  }
  return result;
}
