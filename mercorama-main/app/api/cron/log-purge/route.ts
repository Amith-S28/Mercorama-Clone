// app/api/cron/log-purge/route.ts
// Enforces the 90-day rolling retention window stated in /data-retention.
// Run weekly via server crontab:
//   0 3 * * 1 curl -s -H "x-cron-secret: $CRON_SECRET" http://localhost:3000/api/cron/log-purge
//
// Tables purged:
//   fund_my_export_runs  — monthly run counters per user (year_month keyed)
//   freight_connect_sla_log — SLA event log
//   funding_sync_log     — EDC/BDC sync run log
//   admin_changelog      — internal pipeline changelog
//
// Prompt content is never stored — only counts, timestamps, and status codes.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

const CRON_SECRET = process.env.CRON_SECRET ?? '';
const RETENTION_DAYS = 90;

function cutoffDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - RETENTION_DAYS);
  return d.toISOString();
}

// fund_my_export_runs uses year_month (e.g. "2025-12") not a timestamp.
// Build the oldest year_month string that falls within the 90-day window.
function cutoffYearMonth(): string {
  const d = new Date();
  d.setDate(d.getDate() - RETENTION_DAYS);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

interface PurgeResult {
  table: string;
  deleted: number | null;
  error?: string;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('x-cron-secret');
  if (CRON_SECRET && auth !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createServiceClient();
  const cutoff = cutoffDate();
  const cutoffMonth = cutoffYearMonth();
  const results: PurgeResult[] = [];

  // ── 1. fund_my_export_runs ─────────────────────────────────────────────────
  try {
    const { error, count } = await db
      .from('fund_my_export_runs')
      .delete({ count: 'exact' })
      .lt('year_month', cutoffMonth);
    results.push({ table: 'fund_my_export_runs', deleted: count ?? null, error: error?.message });
  } catch (e) {
    results.push({ table: 'fund_my_export_runs', deleted: null, error: String(e) });
  }

  // ── 2. freight_connect_sla_log ─────────────────────────────────────────────
  try {
    const { error, count } = await db
      .from('freight_connect_sla_log')
      .delete({ count: 'exact' })
      .lt('created_at', cutoff);
    results.push({ table: 'freight_connect_sla_log', deleted: count ?? null, error: error?.message });
  } catch (e) {
    results.push({ table: 'freight_connect_sla_log', deleted: null, error: String(e) });
  }

  // ── 3. funding_sync_log ────────────────────────────────────────────────────
  try {
    const { error, count } = await db
      .from('funding_sync_log')
      .delete({ count: 'exact' })
      .lt('created_at', cutoff);
    results.push({ table: 'funding_sync_log', deleted: count ?? null, error: error?.message });
  } catch (e) {
    results.push({ table: 'funding_sync_log', deleted: null, error: String(e) });
  }

  // ── 4. admin_changelog ────────────────────────────────────────────────────
  try {
    const { error, count } = await db
      .from('admin_changelog')
      .delete({ count: 'exact' })
      .lt('created_at', cutoff);
    results.push({ table: 'admin_changelog', deleted: count ?? null, error: error?.message });
  } catch (e) {
    results.push({ table: 'admin_changelog', deleted: null, error: String(e) });
  }

  const totalDeleted = results.reduce((sum, r) => sum + (r.deleted ?? 0), 0);
  const errors = results.filter((r) => r.error);

  console.log(`[mercorama] log-purge: ${totalDeleted} rows deleted across ${results.length} tables`, results);

  return NextResponse.json({
    purged_at: new Date().toISOString(),
    retention_days: RETENTION_DAYS,
    cutoff,
    results,
    total_deleted: totalDeleted,
    errors: errors.length,
  });
}
