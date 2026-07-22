// app/api/admin/freight-connect/overview/route.ts
// Combined: SME tier counts, quote stats, founding partner list.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminAuth';

export const runtime = 'nodejs';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // SME plan counts (users with freight-connect access)
  const { data: users } = await db
    .from('users')
    .select('id, plan_tier')
    .in('plan_tier', ['pro', 'team', 'enterprise']);

  const starterCount = (users ?? []).filter((u) => u.plan_tier === 'pro').length;
  const growthCount  = (users ?? []).filter((u) => u.plan_tier === 'team' || u.plan_tier === 'enterprise').length;
  const totalSmesWithFc = starterCount + growthCount;

  // Quote request counts this month
  const { data: quotes } = await db
    .from('quote_requests')
    .select('sme_user_id')
    .gte('created_at', thisMonthStart);

  const totalQuotes    = (quotes ?? []).length;
  const uniqueSmeUsers = new Set((quotes ?? []).map((q) => q.sme_user_id)).size;
  const avgQuotesPerSme = uniqueSmeUsers > 0 ? (totalQuotes / uniqueSmeUsers).toFixed(1) : '0';

  // Founding partners
  const { data: fps } = await db
    .from('freight_forwarders')
    .select('id, company_name, claimed_at, founding_partner_lock_expiry, subscription_tier')
    .eq('is_founding_partner', true)
    .order('claimed_at', { ascending: false });

  return NextResponse.json({
    sme_counts: {
      starter: starterCount,
      growth:  growthCount,
      total_with_fc: totalSmesWithFc,
    },
    quotes_this_month:     totalQuotes,
    active_sme_users:      uniqueSmeUsers,
    avg_quotes_per_sme:    avgQuotesPerSme,
    founding_partners:     fps ?? [],
    founding_partner_spots: 3,  // configurable cap
  });
}

export async function POST(req: NextRequest) {
  // Manually add or toggle founding partner status
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    forwarder_id: string;
    is_founding_partner: boolean;
    lock_months?: number;  // default 12
  };

  const { forwarder_id, is_founding_partner, lock_months = 12 } = body;
  if (!forwarder_id) return NextResponse.json({ error: 'forwarder_id required' }, { status: 400 });

  const db = createServiceClient();

  const lockExpiry = is_founding_partner
    ? new Date(Date.now() + lock_months * 30 * 86400000).toISOString()
    : null;

  await db
    .from('freight_forwarders')
    .update({
      is_founding_partner:          is_founding_partner,
      founding_partner_lock_expiry: lockExpiry,
    })
    .eq('id', forwarder_id);

  return NextResponse.json({ ok: true, forwarder_id, is_founding_partner, founding_partner_lock_expiry: lockExpiry });
}
