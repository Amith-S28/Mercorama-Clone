// app/api/stripe/webhook/route.ts
// Stripe webhook handler — verifies signature, handles subscription events
// and the checkout.session.completed event that creates a Supabase auth user.
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { config } from '@/lib/config';
import {
  sendSubscriptionCancelledEmail,
  sendPaymentFailedEmail,
} from '@/lib/betaEmails';

export const runtime = 'nodejs';

// Required: disable body parsing so we can verify Stripe's signature
export const dynamic = 'force-dynamic';

async function getUserByCustomerId(customerId: string, db: ReturnType<typeof createServiceClient>) {
  const { data } = await db
    .from('users')
    .select('id, email, plan_tier')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  return data;
}

export async function POST(req: NextRequest) {
  const sig    = req.headers.get('stripe-signature');
  const secret = config.stripeWebhookSecret;

  if (!sig || !secret) {
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.error('[stripe/webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  const db = createServiceClient();

  // Supabase Admin client — required for auth.admin.createUser()
  const supabaseAdmin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    switch (event.type) {

      // ── Checkout completed — create Supabase auth user + mark code used ──
      case 'checkout.session.completed': {
        const session  = event.data.object as Stripe.Checkout.Session;
        const meta     = session.metadata ?? {};
        const accessCode  = meta.access_code;
        const planTier    = meta.selected_plan ?? 'starter';
        const custId      = typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id ?? null;

        if (!accessCode) {
          console.warn('[stripe/webhook] checkout.session.completed: no access_code in metadata — skipping');
          break;
        }

        // Fetch the access_code row to get the email + verify not already used
        const { data: codeRow } = await db
          .from('access_codes')
          .select('email, used_at, is_active')
          .eq('code', accessCode)
          .maybeSingle();

        if (!codeRow) {
          console.error('[stripe/webhook] checkout.session.completed: access_code not found:', accessCode);
          break;
        }

        if (codeRow.used_at) {
          // Idempotent — already processed, do nothing
          console.info('[stripe/webhook] checkout.session.completed: code already used, skipping:', accessCode);
          break;
        }

        const email = codeRow.email as string;

        // 1. Invite user via Supabase Auth — sends a magic-link email to set password
        let authUserId: string | null = null;
        const { data: authData, error: authError } =
          await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
          });

        if (authError) {
          // User may already exist (idempotency) — look them up
          if (authError.message?.includes('already been registered') || authError.code === 'email_exists') {
            const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
            const found = existing?.users?.find((u) => u.email === email);
            if (found) {
              authUserId = found.id;
            } else {
              console.error('[stripe/webhook] inviteUserByEmail error (unknown):', authError);
              break;
            }
          } else {
            console.error('[stripe/webhook] inviteUserByEmail error:', authError);
            break;
          }
        } else {
          authUserId = authData.user.id;
        }

        // 2. Mark access_code as used (single-use enforcement)
        await db
          .from('access_codes')
          .update({ used_at: new Date().toISOString() })
          .eq('code', accessCode);

        // 3. Update beta_applications — set activated_at, stripe_customer_id, clear access_code
        await db
          .from('beta_applications')
          .update({
            status:             'activated',
            activated_at:       new Date().toISOString(),
            stripe_customer_id: custId ?? undefined,
            access_code:        null,
          })
          .eq('email', email.toLowerCase());

        // 4. Upsert into users table so the app can look up plan/tier
        await db
          .from('users')
          .upsert(
            {
              id:                 authUserId,
              email:              email.toLowerCase(),
              plan_tier:          planTier,
              stripe_customer_id: custId ?? null,
              subscription_status: 'active',
            },
            { onConflict: 'id' }
          );

        console.info('[stripe/webhook] checkout.session.completed: user activated:', email);
        break;
      }

      // ── Subscription created — confirm active ───────────────────────────
      case 'customer.subscription.created': {
        const sub       = event.data.object as Stripe.Subscription;
        const custId    = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
        const user      = await getUserByCustomerId(custId, db);
        if (user) {
          await db
            .from('users')
            .update({
              subscription_id:     sub.id,
              subscription_status: sub.status,
            })
            .eq('id', user.id);
        }
        break;
      }

      // ── Subscription deleted — deactivate plan ──────────────────────────
      case 'customer.subscription.deleted': {
        const sub    = event.data.object as Stripe.Subscription;
        const custId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
        const user   = await getUserByCustomerId(custId, db);
        if (user) {
          await db
            .from('users')
            .update({
              plan_tier:           'free',
              subscription_status: 'cancelled',
            })
            .eq('id', user.id);

          if (user.email) {
            void sendSubscriptionCancelledEmail({
              toEmail:  user.email,
              fullName: user.email, // name not stored separately; email as fallback
            }).catch((e) => console.error('[stripe/webhook] Cancel email error:', e));
          }
        }
        break;
      }

      // ── Payment succeeded — log and confirm active ───────────────────────
      case 'invoice.payment_succeeded': {
        const inv    = event.data.object as Stripe.Invoice;
        const custId = typeof inv.customer === 'string' ? inv.customer : (inv.customer as Stripe.Customer)?.id;
        if (custId) {
          const user = await getUserByCustomerId(custId, db);
          if (user) {
            await db
              .from('users')
              .update({ subscription_status: 'active' })
              .eq('id', user.id);
          }
        }
        break;
      }

      // ── Payment failed — notify user ─────────────────────────────────────
      case 'invoice.payment_failed': {
        const inv    = event.data.object as Stripe.Invoice;
        const custId = typeof inv.customer === 'string' ? inv.customer : (inv.customer as Stripe.Customer)?.id;
        if (custId) {
          const user = await getUserByCustomerId(custId, db);
          if (user) {
            await db
              .from('users')
              .update({ subscription_status: 'past_due' })
              .eq('id', user.id);

            if (user.email) {
              void sendPaymentFailedEmail({
                toEmail:  user.email,
                fullName: user.email,
              }).catch((e) => console.error('[stripe/webhook] PaymentFailed email error:', e));
            }
          }
        }
        break;
      }

      default:
        // Ignore unhandled events
        break;
    }
  } catch (err) {
    console.error('[stripe/webhook] Handler error:', err);
    return NextResponse.json({ error: 'handler_error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
