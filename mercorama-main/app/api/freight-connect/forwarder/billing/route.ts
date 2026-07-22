// app/api/freight-connect/forwarder/billing/route.ts
// Returns subscription, lead charges, and Stripe invoices for the forwarder.
import { NextResponse } from 'next/server';
import { supabase, createServiceClient } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = createServiceClient();
    const { data: ff } = await db
      .from('freight_forwarders')
      .select('id, subscription_tier, stripe_customer_id, is_founding_partner, founding_partner_lock_expiry, subscription_start_date, subscription_end_date')
      .eq('primary_contact_email', user.email)
      .maybeSingle();

    if (!ff) return NextResponse.json({ error: 'no_forwarder_found' }, { status: 404 });

    // Active subscription row
    const { data: sub } = await db
      .from('forwarder_subscriptions')
      .select('*')
      .eq('forwarder_id', ff.id)
      .in('status', ['active', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Lead charges (last 50)
    const { data: charges } = await db
      .from('forwarder_lead_charges')
      .select(`
        id, amount, lead_tier, refunded, refunded_at, created_at, stripe_charge_id,
        quote_requests!inner(hs_chapter, target_market, shipping_mode, product_category)
      `)
      .eq('forwarder_id', ff.id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Stripe invoices (last 12)
    let invoices: object[] = [];
    if (ff.stripe_customer_id) {
      try {
        const stripeInvoices = await stripe.invoices.list({
          customer: ff.stripe_customer_id,
          limit:    12,
        });
        invoices = stripeInvoices.data.map((inv) => ({
          id:             inv.id,
          number:         inv.number,
          status:         inv.status,
          amount_due:     inv.amount_due,
          amount_paid:    inv.amount_paid,
          currency:       inv.currency,
          created:        inv.created,
          period_start:   inv.period_start,
          period_end:     inv.period_end,
          hosted_invoice_url: inv.hosted_invoice_url,
          invoice_pdf:    inv.invoice_pdf,
        }));
      } catch {
        // Stripe may not be configured — non-fatal
      }
    }

    return NextResponse.json({
      subscription:     sub ?? null,
      lead_charges:     charges ?? [],
      invoices,
      is_founding_partner:         ff.is_founding_partner,
      founding_partner_lock_expiry: ff.founding_partner_lock_expiry,
      subscription_tier:            ff.subscription_tier,
    });

  } catch (err) {
    console.error('[FC forwarder/billing] error:', err);
    return NextResponse.json({ error: 'Billing data failed' }, { status: 500 });
  }
}
