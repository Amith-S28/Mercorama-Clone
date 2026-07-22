// app/api/admin/freight-connect/revenue/route.ts
// MRR + lead gen + refunds overview for the admin panel.
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminAuth';

export const runtime = 'nodejs';

// Tier → monthly price in CAD
const TIER_MONTHLY: Record<string, number> = {
  verified: 499,
  featured: 999,
};

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Active subscriptions
  const { data: subs } = await db
    .from('forwarder_subscriptions')
    .select('tier, billing_period, forwarder_id')
    .eq('status', 'active');

  let mrrVerified = 0;
  let mrrFeatured = 0;

  for (const s of (subs ?? [])) {
    const monthly = s.billing_period === 'annual'
      ? (TIER_MONTHLY[s.tier] ?? 0) * (10 / 12)   // annual discount applied
      : (TIER_MONTHLY[s.tier] ?? 0);

    if (s.tier === 'verified')  mrrVerified += monthly;
    if (s.tier === 'featured')  mrrFeatured += monthly;
  }

  // Lead charges this month
  const { data: charges } = await db
    .from('forwarder_lead_charges')
    .select('amount, lead_tier, refunded')
    .gte('created_at', thisMonthStart);

  let leadRevQuoteOnly  = 0;
  let leadRevAnonymised = 0;
  let refundsThisMonth  = 0;

  for (const c of (charges ?? [])) {
    if (!c.refunded) {
      if (c.lead_tier === 'quote_only')        leadRevQuoteOnly  += Number(c.amount);
      if (c.lead_tier === 'anonymised_profile') leadRevAnonymised += Number(c.amount);
    } else {
      refundsThisMonth += Number(c.amount);
    }
  }

  const totalLeadRev = leadRevQuoteOnly + leadRevAnonymised;
  const netRevenue   = mrrVerified + mrrFeatured + totalLeadRev - refundsThisMonth;

  // 6-month forward MRR projection (constant based on current active subs)
  const currentMrr = mrrVerified + mrrFeatured;
  const months: { label: string; mrr: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push({
      label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
      mrr:   Math.round(currentMrr),
    });
  }

  return NextResponse.json({
    mrr_verified:     Math.round(mrrVerified),
    mrr_featured:     Math.round(mrrFeatured),
    total_mrr:        Math.round(mrrVerified + mrrFeatured),
    lead_rev_quote_only:   Math.round(leadRevQuoteOnly),
    lead_rev_anonymised:   Math.round(leadRevAnonymised),
    total_lead_rev:        Math.round(totalLeadRev),
    refunds_this_month:    Math.round(refundsThisMonth),
    net_revenue:           Math.round(netRevenue),
    subscriber_count:      (subs ?? []).length,
    projected_mrr_6mo:     months,
  });
}
