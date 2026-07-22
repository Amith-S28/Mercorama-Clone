// app/api/admin/freight-connect/quotes/route.ts
// GET: all quote requests (admin monitor). POST: manual refund override.
// PRIVACY: sme_user_id and all user PII excluded from GET results.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminAuth';
import { stripe } from '@/lib/stripe';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const stateFilter    = sp.get('state')       ?? '';
  const tierFilter     = sp.get('lead_tier')   ?? '';
  const forwarderTier  = sp.get('forwarder_tier') ?? '';
  const dateFrom       = sp.get('date_from')   ?? '';
  const dateTo         = sp.get('date_to')     ?? '';

  const db = createServiceClient();

  let query = db
    .from('quote_requests')
    .select(`
      id, state, created_at, responded_at, response_deadline,
      product_category, hs_chapter, origin_province, target_market,
      estimated_volume, shipping_mode,
      lead_tier, lead_fee, lead_charged, lead_refunded,
      is_bulk, bulk_group_id,
      forwarder_id,
      freight_forwarders!inner(company_name, state, subscription_tier)
    `)
    .order('created_at', { ascending: false })
    .limit(200);

  if (stateFilter)   query = query.eq('state', stateFilter);
  if (tierFilter)    query = query.eq('lead_tier', tierFilter);
  if (dateFrom)      query = query.gte('created_at', dateFrom);
  if (dateTo)        query = query.lte('created_at', dateTo);
  if (forwarderTier) query = query.eq('freight_forwarders.subscription_tier', forwarderTier);

  const { data: quotes, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // sme_user_id is NOT selected — privacy enforced at query level
  return NextResponse.json({ quotes: quotes ?? [] });
}

export async function POST(req: NextRequest) {
  // Manual refund override
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { quote_request_id: string };
  const { quote_request_id } = body;
  if (!quote_request_id) return NextResponse.json({ error: 'quote_request_id required' }, { status: 400 });

  const db = createServiceClient();

  // Find charge record
  const { data: charge } = await db
    .from('forwarder_lead_charges')
    .select('id, stripe_charge_id, amount, refunded')
    .eq('quote_request_id', quote_request_id)
    .eq('refunded', false)
    .maybeSingle();

  if (!charge) {
    return NextResponse.json({ error: 'No unrefunded charge found for this quote' }, { status: 404 });
  }

  // Issue Stripe refund
  const refund = await stripe.refunds.create({
    charge: charge.stripe_charge_id,
    reason: 'requested_by_customer',
  });

  await db
    .from('forwarder_lead_charges')
    .update({ refunded: true, refunded_at: new Date().toISOString(), stripe_refund_id: refund.id })
    .eq('id', charge.id);

  await db
    .from('quote_requests')
    .update({ lead_refunded: true })
    .eq('id', quote_request_id);

  return NextResponse.json({ refunded: true, refund_id: refund.id, amount: charge.amount });
}
