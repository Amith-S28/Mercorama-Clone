// app/api/freight-connect/stripe/webhook/route.ts
// Handles Stripe webhook events for Freight Connect subscriptions
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase';
import { verifyForwarder } from '@/lib/freightConnect';
import { config } from '@/lib/config';

export const runtime = 'nodejs';

// Stripe requires raw body for signature verification — disable body parsing
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      config.stripeWebhookSecret
    );
  } catch (err) {
    console.error('[FC webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  const db = createServiceClient();

  try {
    switch (event.type) {

      // ── Checkout completed (subscription purchase) ──────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;

        const { forwarder_id, tier, billing_period } = session.metadata ?? {};
        if (!forwarder_id || !tier) break;

        // Transition forwarder state
        await verifyForwarder(forwarder_id, tier as 'verified' | 'featured');

        // Record subscription
        const subscriptionId = session.subscription as string;
        const sub = await stripe.subscriptions.retrieve(subscriptionId);

        await db.from('forwarder_subscriptions').insert({
          forwarder_id,
          stripe_subscription_id: subscriptionId,
          tier,
          billing_period: billing_period ?? 'monthly',
          status:         sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end:   new Date(sub.current_period_end   * 1000).toISOString(),
        });

        // Update forwarder's stripe_customer_id if not already set
        if (session.customer) {
          await db
            .from('freight_forwarders')
            .update({ stripe_customer_id: session.customer as string })
            .eq('id', forwarder_id)
            .is('stripe_customer_id', null);
        }

        console.log(`[FC webhook] Forwarder ${forwarder_id} upgraded to ${tier}`);
        break;
      }

      // ── Subscription updated (tier change or renewal) ────────────────────
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const { forwarder_id, tier } = sub.metadata ?? {};
        if (!forwarder_id) break;

        await db
          .from('forwarder_subscriptions')
          .update({
            status:               sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end:   new Date(sub.current_period_end   * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);

        // If tier changed (e.g. verified → featured), update forwarder state
        if (tier && (tier === 'verified' || tier === 'featured')) {
          await verifyForwarder(forwarder_id, tier);
        }

        break;
      }

      // ── Subscription cancelled / ended ───────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const { forwarder_id } = sub.metadata ?? {};
        if (!forwarder_id) break;

        // Downgrade to claimed (keep listing active but remove subscription perks)
        await db
          .from('freight_forwarders')
          .update({
            state:              'claimed',
            subscription_tier:  'none',
            subscription_end_date: new Date().toISOString(),
          })
          .eq('id', forwarder_id);

        await db
          .from('forwarder_subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', sub.id);

        console.log(`[FC webhook] Forwarder ${forwarder_id} subscription cancelled — downgraded to claimed`);
        break;
      }

      // ── Payment failure (subscription invoice) ───────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find forwarder by Stripe customer ID
        const { data: ff } = await db
          .from('freight_forwarders')
          .select('id, company_name, primary_contact_email')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (ff) {
          console.warn(`[FC webhook] Payment failed for forwarder ${ff.id} (${ff.company_name})`);
          // Stripe will retry — no immediate action needed.
          // After final retry, subscription.deleted fires and we downgrade.
        }
        break;
      }

      default:
        // Silently ignore unhandled events
        break;
    }
  } catch (err) {
    console.error(`[FC webhook] Error processing event ${event.type}:`, err);
    // Return 200 to Stripe to prevent retries for handler errors
    return NextResponse.json({ error: 'Handler error', type: event.type }, { status: 200 });
  }

  return NextResponse.json({ received: true });
}
