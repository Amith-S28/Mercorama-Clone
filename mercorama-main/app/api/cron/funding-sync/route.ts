// app/api/cron/funding-sync/route.ts
// Weekly cron endpoint: triggered by Vercel Cron or external scheduler

import { NextRequest, NextResponse } from 'next/server';
import { runWeeklySync } from '@/lib/fundingSync';
import { purgeExpiredCache } from '@/lib/fundMyExportCache';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes — sync can take time on Haiku

export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret');
  const authHeader = req.headers.get('authorization');
  const serverCronSecret = process.env.CRON_SECRET ?? '';
  const fundingSecret = process.env.FUNDING_SYNC_SECRET ?? '';

  const isAuthed = (cronSecret && cronSecret === serverCronSecret)
    || (fundingSecret && authHeader === `Bearer ${fundingSecret}`);

  if (!isAuthed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [syncResult, purgedCount] = await Promise.all([
      runWeeklySync(),
      purgeExpiredCache(),
    ]);

    console.log(
      `[mercorama] Funding sync complete — changes: ${syncResult.changes_found}, cache purged: ${purgedCount}`
    );

    return NextResponse.json({
      synced_at: new Date().toISOString(),
      programs_checked: syncResult.changes_found >= 0 ? 'see sync log' : 0,
      changes_detected: syncResult.changes_found,
      cache_entries_purged: purgedCount,
      sync_log_id: syncResult.sync_log_id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[mercorama] Funding sync cron failed:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
