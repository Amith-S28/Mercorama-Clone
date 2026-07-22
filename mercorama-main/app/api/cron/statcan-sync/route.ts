// app/api/cron/statcan-sync/route.ts
// Stats Canada monthly sync — batch or single HS code.
// Batch mode syncs top 10 Canadian export HS codes.
import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { ingestStatCanHSCode } from '@/lib/statcan';
import { createServiceClient } from '@/lib/supabase';

export const runtime  = 'nodejs';
export const maxDuration = 300;

// Top 20 Canadian export HS codes for StatCan sync (validated Apr 2026)
const PRIORITY_HS_CODES = [
  '270900','271121','271012','271019','870323',
  '870360','710812','841191','100199','120510',
  '310420','440710','300490','760110','260111',
  '870324','880240','470321','841182','190590',
];

export async function GET(req: NextRequest) {
  const auth = req.headers.get('x-cron-secret');
  if (config.cronSecret && auth !== config.cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const singleCode = req.nextUrl.searchParams.get('hs_code');
  const quick = req.nextUrl.searchParams.get('quick') === '1';
  const now = new Date().toISOString();
  const t0 = Date.now();

  // Single code mode
  if (singleCode) {
    try {
      const result = await ingestStatCanHSCode(singleCode);
      return NextResponse.json({ ran_at: now, mode: 'single', hs_code: singleCode, ...result });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'StatCan sync failed' }, { status: 500 });
    }
  }

  // Batch mode
  const codes = quick ? PRIORITY_HS_CODES.slice(0, 3) : PRIORITY_HS_CODES;
  let totalRows = 0;
  const errors: string[] = [];

  for (const code of codes) {
    try {
      const result = await ingestStatCanHSCode(code);
      totalRows += result.rowsWritten;
    } catch (err) {
      errors.push(`${code}: ${err instanceof Error ? err.message : 'failed'}`);
    }
  }

  const duration = Date.now() - t0;

  const db = createServiceClient();
  await db.from('admin_changelog').insert({
    entry_type: 'rate_update',
    title: `StatCan ${quick ? 'quick' : 'batch'} sync — ${codes.length} HS codes, ${totalRows} rows`,
    description: errors.length ? `Errors: ${errors.join('; ')}` : 'Completed without errors.',
    affected_tables: ['trade_flows'],
    created_by: 'cron',
    severity: 'low',
  }).then(null, () => {});

  return NextResponse.json({ ran_at: now, mode: quick ? 'quick' : 'batch', codes: codes.length, totalRows, errors, duration_ms: duration });
}
