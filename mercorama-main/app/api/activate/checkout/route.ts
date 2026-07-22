// app/api/activate/checkout/route.ts
// POST — create a Stripe Checkout Session for the founding member plan.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
import { config } from '@/lib/config';

export const runtime = 'nodejs';

function priceIdForPlan(plan: string): string {
  if (plan === 'starter') return config.stripePriceStarterFounding;
  if (plan === 'growth')  return config.stripePriceGrowthFounding;
  throw new Error(`Unknown plan: ${plan}`);
}

export async function POST(req: NextRequest) {
  const { code } = await req.json() as { code: string };
  if (!code) {
    return NextResponse.json({ error: 'missing_code' }, { status: 400 });
  }

  const db = createServiceClient();

  // Re-validate the code
  const { data: record } = await db
    .from('access_codes')
    .select('email, selected_plan, cohort_number, expires_at, used_at, is_active')
    .eq('code', code)
    .maybeSingle();

  if (!record || !record.is_active || record.used_at || new Date(record.expires_at) < new Date()) {
    return NextResponse.json({ error: 'invalid_code' }, { status: 403 });
  }

  // Verify beta_application is still in 'accepted' status (Audit 6)
  const { data: application } = await db
    .from('beta_applications')
    .select('status')
    .eq('email', record.email.toLowerCase())
    .maybeSingle();

  if (!application || application.status !== 'accepted') {
    return NextResponse.json({ error: 'invalid_code' }, { status: 403 });
  }

  // Check for existing Stripe customer
  const { data: existingApp } = await db
    .from('beta_applications')
    .select('stripe_customer_id, full_name')
    .eq('email', record.email.toLowerCase())
    .maybeSingle();

  let customerId: string;
  if (existingApp?.stripe_customer_id) {
    customerId = existingApp.stripe_customer_id;
  } else {
    const customer = await stripe.customers.create({
      email: record.email,
      name:  existingApp?.full_name ?? undefined,
      metadata: { cohort_number: String(record.cohort_number) },
    });
    customerId = customer.id;
  }

  const priceId = priceIdForPlan(record.selected_plan);
  const siteUrl = config.siteUrl;

  const session = await stripe.checkout.sessions.create({
    mode:       'subscription',
    customer:   customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/activate/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${siteUrl}/activate?code=${encodeURIComponent(code)}&cancelled=1`,
    metadata: {
      access_code:    code,
      cohort_number:  String(record.cohort_number),
      selected_plan:  record.selected_plan,
    },
  });

  return NextResponse.json({ url: session.url });
}
