// app/api/freight-connect/forwarder/analytics/route.ts
// Analytics for verified/featured forwarders: quote trends, response rate, identity reveals.
import { NextResponse } from 'next/server';
import { supabase, createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = createServiceClient();
    const { data: ff } = await db
      .from('freight_forwarders')
      .select('id, subscription_tier')
      .eq('primary_contact_email', user.email)
      .maybeSingle();

    if (!ff) return NextResponse.json({ error: 'no_forwarder_found' }, { status: 404 });

    if (ff.subscription_tier === 'none') {
      return NextResponse.json({ error: 'analytics_requires_subscription' }, { status: 403 });
    }

    const now = new Date();

    // Last 6 calendar months (for chart)
    const months: { label: string; start: string; end: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
      months.push({
        label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        start,
        end,
      });
    }

    // All quotes for this forwarder
    const { data: allQuotes } = await db
      .from('quote_requests')
      .select('id, state, created_at, responded_at, user_identity_revealed')
      .eq('forwarder_id', ff.id);

    const quotes = allQuotes ?? [];

    // 30-day + 90-day windows
    const d30  = new Date(now.getTime() - 30 * 86400000).toISOString();
    const d90  = new Date(now.getTime() - 90 * 86400000).toISOString();
    const m6   = months[0].start;

    const in30   = quotes.filter((q) => q.created_at >= d30);
    const in90   = quotes.filter((q) => q.created_at >= d90);
    const in6mo  = quotes.filter((q) => q.created_at >= m6);

    function responseRate(qs: typeof quotes) {
      if (qs.length === 0) return 0;
      const responded = qs.filter((q) => q.state === 'responded').length;
      return Math.round((responded / qs.length) * 100);
    }

    // Monthly breakdown for charts
    const monthlyLeads = months.map((m) => ({
      label:     m.label,
      count:     quotes.filter((q) => q.created_at >= m.start && q.created_at <= m.end).length,
      responded: quotes.filter((q) => q.responded_at && q.responded_at >= m.start && q.responded_at <= m.end).length,
    }));

    const monthlyResponseRate = monthlyLeads.map((m) => ({
      label: m.label,
      rate:  m.count === 0 ? 0 : Math.round((m.responded / m.count) * 100),
    }));

    // Profile views
    const { data: views30 } = await db
      .from('forwarder_profile_views')
      .select('id', { count: 'exact', head: true })
      .eq('forwarder_id', ff.id)
      .gte('viewed_at', d30);

    const { data: views90 } = await db
      .from('forwarder_profile_views')
      .select('id', { count: 'exact', head: true })
      .eq('forwarder_id', ff.id)
      .gte('viewed_at', d90);

    // Counts
    const reveals30 = in30.filter((q) => q.user_identity_revealed).length;
    const reveals90 = in90.filter((q) => q.user_identity_revealed).length;

    return NextResponse.json({
      last_30_days: {
        leads_received:   in30.length,
        leads_responded:  in30.filter((q) => q.state === 'responded').length,
        response_rate:    responseRate(in30),
        identity_reveals: reveals30,
        profile_views:    (views30 as unknown as { count: number })?.count ?? 0,
      },
      last_90_days: {
        leads_received:   in90.length,
        leads_responded:  in90.filter((q) => q.state === 'responded').length,
        response_rate:    responseRate(in90),
        identity_reveals: reveals90,
        profile_views:    (views90 as unknown as { count: number })?.count ?? 0,
      },
      six_month_leads:         monthlyLeads,
      six_month_response_rate: monthlyResponseRate,
      total_all_time:          quotes.length,
      response_rate_all_time:  responseRate(quotes),
    });

  } catch (err) {
    console.error('[FC forwarder/analytics] error:', err);
    return NextResponse.json({ error: 'Analytics failed' }, { status: 500 });
  }
}
