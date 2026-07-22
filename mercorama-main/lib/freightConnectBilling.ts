// lib/freightConnectBilling.ts
// Stripe billing for Freight Connect: SetupIntents, pay-per-lead charges, subscription checkout
import 'server-only';

import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase';
import { calculateLeadFee } from '@/lib/freightConnect';
import type { ForwarderState } from '@/lib/freightConnect';

// ─── Stripe Price / Coupon IDs (configure via env) ──────────────────────────

export const STRIPE_PRICE_IDS = {
  verified_monthly: process.env.STRIPE_PRICE_VERIFIED_MONTHLY ?? '',
  verified_annual:  process.env.STRIPE_PRICE_VERIFIED_ANNUAL  ?? '',
  featured_monthly: process.env.STRIPE_PRICE_FEATURED_MONTHLY ?? '',
  featured_annual:  process.env.STRIPE_PRICE_FEATURED_ANNUAL  ?? '',
} as const;

export const STRIPE_FOUNDING_COUPON = process.env.STRIPE_COUPON_FOUNDING_PARTNER ?? '';

// ─── Create SetupIntent (card save for pay-per-lead) ────────────────────────

export async function createForwarderSetupIntent(
  forwarderId: string,
  companyName: string,
  contactEmail: string
): Promise<{ clientSecret: string; customerId: string }> {
  // Reuse existing customer if one exists for this email
  const existing = await stripe.customers.list({ email: contactEmail, limit: 1 });

  let customerId: string;
  if (existing.data.length > 0) {
    customerId = existing.data[0].id;
  } else {
    const customer = await stripe.customers.create({
      email: contactEmail,
      name:  companyName,
      metadata: { forwarder_id: forwarderId, source: 'freight_connect' },
    });
    customerId = customer.id;
  }

  const setupIntent = await stripe.setupIntents.create({
    customer:             customerId,
    usage:                'off_session',
    payment_method_types: ['card'],
    metadata: {
      forwarder_id: forwarderId,
      purpose:      'lead_charges',
    },
  });

  return {
    clientSecret: setupIntent.client_secret!,
    customerId,
  };
}

// ─── Pay-per-lead charge (claimed forwarders only) ───────────────────────────

export async function chargeLeadFee(
  forwarderId: string,
  quoteRequestId: string,
  state: ForwarderState,
  leadTier: 'quote_only' | 'anonymised_profile'
): Promise<string | null> {
  const fee = calculateLeadFee(state, leadTier);
  if (fee === 0) return null; // verified / featured — free, no charge needed

  const db = createServiceClient();

  const { data: ff } = await db
    .from('freight_forwarders')
    .select('stripe_customer_id, stripe_payment_method_on_file')
    .eq('id', forwarderId)
    .single();

  if (!ff?.stripe_customer_id) {
    throw new Error(`No Stripe customer on file for forwarder ${forwarderId}`);
  }
  if (!ff.stripe_payment_method_on_file) {
    throw new Error(`No payment method saved for forwarder ${forwarderId}`);
  }

  // Retrieve default payment method from Stripe customer
  const customer = await stripe.customers.retrieve(ff.stripe_customer_id) as Stripe.Customer;
  const pmId = customer.invoice_settings?.default_payment_method as string | null;

  if (!pmId) {
    throw new Error('No default payment method found on Stripe customer');
  }

  // Charge off-session
  const pi = await stripe.paymentIntents.create({
    amount:          Math.round(fee * 100), // cents CAD
    currency:        'cad',
    customer:        ff.stripe_customer_id,
    payment_method:  pmId,
    confirm:         true,
    off_session:     true,
    description:     `FC lead fee — ${leadTier} — quote ${quoteRequestId}`,
    metadata: {
      forwarder_id:     forwarderId,
      quote_request_id: quoteRequestId,
      lead_tier:        leadTier,
    },
  });

  const stripeChargeId = typeof pi.latest_charge === 'string'
    ? pi.latest_charge
    : (pi.latest_charge as Stripe.Charge | null)?.id ?? null;

  // Record charge in DB
  await db.from('forwarder_lead_charges').insert({
    forwarder_id:     forwarderId,
    quote_request_id: quoteRequestId,
    stripe_charge_id: stripeChargeId,
    amount:           fee,
    lead_tier:        leadTier,
    refunded:         false,
  });

  return pi.id;
}

// ─── Subscription Checkout Session ───────────────────────────────────────────

export async function createSubscriptionCheckout(
  forwarderId: string,
  tier: 'verified' | 'featured',
  billingPeriod: 'monthly' | 'annual',
  isFoundingPartner: boolean
): Promise<string> {
  const db = createServiceClient();

  const { data: ff } = await db
    .from('freight_forwarders')
    .select('stripe_customer_id, company_name, primary_contact_email')
    .eq('id', forwarderId)
    .single();

  if (!ff) throw new Error('Forwarder not found');

  const priceKey = `${tier}_${billingPeriod}` as keyof typeof STRIPE_PRICE_IDS;
  const priceId  = STRIPE_PRICE_IDS[priceKey];
  if (!priceId) {
    throw new Error(`Stripe price not configured: ${priceKey}. Set STRIPE_PRICE_${priceKey.toUpperCase()} in env.`);
  }

  const params: Stripe.Checkout.SessionCreateParams = {
    mode:       'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `https://mercorama.com/freight-connect/upgrade?success=1&forwarder_id=${forwarderId}`,
    cancel_url:  `https://mercorama.com/freight-connect/upgrade`,
    metadata: {
      forwarder_id:   forwarderId,
      tier,
      billing_period: billingPeriod,
    },
    subscription_data: {
      metadata: {
        forwarder_id:   forwarderId,
        tier,
        billing_period: billingPeriod,
      },
    },
  };

  if (ff.stripe_customer_id) {
    params.customer = ff.stripe_customer_id;
  } else if (ff.primary_contact_email) {
    params.customer_email = ff.primary_contact_email;
  }

  if (isFoundingPartner && STRIPE_FOUNDING_COUPON) {
    params.discounts = [{ coupon: STRIPE_FOUNDING_COUPON }];
  }

  const session = await stripe.checkout.sessions.create(params);
  return session.url!;
}

// ─── Save payment method reference after SetupIntent confirmed ───────────────

export async function savePaymentMethod(
  forwarderId: string,
  customerId: string,
  paymentMethodId: string
): Promise<void> {
  // Set as default on Stripe customer
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  // Mark payment method on file in DB
  const db = createServiceClient();
  await db
    .from('freight_forwarders')
    .update({
      stripe_customer_id:            customerId,
      stripe_payment_method_on_file: true,
    })
    .eq('id', forwarderId);
}
