// app/api/cron/data-validation/route.ts
// Data validation — checks integrity of trade_flows and province_intel tables.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

const CRON_SECRET = process.env.CRON_SECRET ?? '';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('x-cron-secret');
  if (CRON_SECRET && auth !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createServiceClient();
  const runAt = new Date().toISOString();
  const checks: { name: string; status: 'ok' | 'warning' | 'error'; detail: string }[] = [];

  // CHECK 1: trade_flows has data
  try {
    const { count } = await db.from('trade_flows').select('*', { count: 'exact', head: true });
    if (count && count > 0) {
      checks.push({ name: 'trade_flows', status: 'ok', detail: `${count} rows` });
    } else {
      checks.push({ name: 'trade_flows', status: 'warning', detail: 'Table empty' });
    }
  } catch {
    checks.push({ name: 'trade_flows', status: 'error', detail: 'Table not accessible' });
  }

  // CHECK 2: province_intel has data for all 4 provinces
  try {
    const { data } = await db.from('province_intel').select('province_code, last_updated');
    const provinces = (data ?? []).map((r: Record<string, unknown>) => r.province_code as string);
    const missing = ['NS', 'ON', 'BC', 'AB'].filter((p) => !provinces.includes(p));
    if (missing.length === 0) {
      checks.push({ name: 'province_intel', status: 'ok', detail: `${data?.length} records, all provinces covered` });
    } else {
      checks.push({ name: 'province_intel', status: 'warning', detail: `Missing: ${missing.join(', ')}` });
    }

    // Check freshness
    const stale = (data ?? []).filter((r: Record<string, unknown>) => {
      const updated = new Date(r.last_updated as string);
      return Date.now() - updated.getTime() > 30 * 24 * 60 * 60 * 1000;
    });
    if (stale.length > 0) {
      checks.push({ name: 'province_intel_freshness', status: 'warning', detail: `${stale.length} records older than 30 days` });
    }
  } catch {
    checks.push({ name: 'province_intel', status: 'error', detail: 'Table not accessible' });
  }

  // CHECK 3: canada_provinces + retail_chains + distributors
  for (const table of ['canada_provinces', 'canada_retail_chains', 'canada_distributors'] as const) {
    try {
      const { count } = await db.from(table).select('*', { count: 'exact', head: true });
      checks.push({ name: table, status: count && count > 0 ? 'ok' : 'warning', detail: `${count ?? 0} rows` });
    } catch {
      checks.push({ name: table, status: 'error', detail: 'Table not accessible' });
    }
  }

  const errorCount = checks.filter((c) => c.status === 'error').length;
  const warningCount = checks.filter((c) => c.status === 'warning').length;

  // Log to changelog
  await db.from('admin_changelog').insert({
    entry_type: 'validation_run',
    title: `Data validation — ${checks.length} checks, ${errorCount} errors, ${warningCount} warnings`,
    description: checks.map((c) => `${c.status.toUpperCase()} ${c.name}: ${c.detail}`).join('; '),
    affected_tables: checks.filter((c) => c.status !== 'ok').map((c) => c.name),
    created_by: 'cron',
    severity: errorCount > 0 ? 'high' : warningCount > 0 ? 'medium' : 'low',
  }).catch(() => {});

  return NextResponse.json({ ran_at: runAt, checks, errors: errorCount, warnings: warningCount });
}
