// app/api/freight-connect/analytics/route.ts
// Growth-only endpoint.
import { NextResponse } from 'next/server';
import { supabase, createServiceClient } from '@/lib/supabase';
import { getSmeAnalytics, getSmeQuotes } from '@/lib/freightConnectQuotes';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Plan gate — enforced server-side via Supabase users table
    const db = createServiceClient();
    const { data: profile } = await db
      .from('users')
      .select('plan_tier')
      .eq('id', user.id)
      .maybeSingle();

    const isGrowth = profile?.plan_tier === 'team' || profile?.plan_tier === 'enterprise';
    if (!isGrowth) {
      return NextResponse.json({ error: 'growth_plan_required' }, { status: 403 });
    }

    const [laneSummary, allQuotes] = await Promise.all([
      getSmeAnalytics(user.id),
      getSmeQuotes(user.id),
    ]);

    // Mode breakdown
    const modeCounts: Record<string, number> = {};
    for (const q of allQuotes) {
      modeCounts[q.shipping_mode] = (modeCounts[q.shipping_mode] ?? 0) + 1;
    }

    // Rate benchmarking — average of last 3 responded ocean quotes with rate data
    const { data: rateRows } = await db
      .from('quote_responses')
      .select('rate_estimate, transit_time, quote_requests!inner(sme_user_id, target_market, shipping_mode)')
      .eq('quote_requests.sme_user_id', user.id)
      .not('rate_estimate', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    // Group last 3 per market+mode for benchmarking
    type BenchmarkKey = string;
    const benchMap = new Map<BenchmarkKey, string[]>();
    for (const row of (rateRows ?? [])) {
      const rawRow = row as unknown as { rate_estimate: string | null; quote_requests: { target_market: string; shipping_mode: string } | null };
      const req = rawRow.quote_requests;
      if (!req || !rawRow.rate_estimate) continue;
      const key = `${req.target_market}||${req.shipping_mode}`;
      const existing = benchMap.get(key) ?? [];
      if (existing.length < 3) {
        benchMap.set(key, [...existing, rawRow.rate_estimate]);
      }
    }
    const benchmarks = Array.from(benchMap.entries()).map(([key, rates]) => {
      const [market, mode] = key.split('||');
      return { market, mode, rates };
    });

    return NextResponse.json({
      lane_summary:  laneSummary,
      mode_breakdown: modeCounts,
      benchmarks,
      total_quotes:  allQuotes.length,
    });

  } catch (err) {
    console.error('[FC analytics] error:', err);
    return NextResponse.json({ error: 'Analytics failed' }, { status: 500 });
  }
}
