// app/activate/success/page.tsx
// Server component — Stripe redirects here after successful checkout.
// Verifies payment, creates/updates user, marks code used, increments cohort spots.
import { redirect } from 'next/navigation';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase';
import { config } from '@/lib/config';
import { sendWelcomeEmail } from '@/lib/betaEmails';

export const runtime = 'nodejs';

async function processActivation(sessionId: string) {
  // ── Verify Stripe session ─────────────────────────────────────────────────
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== 'paid') return { error: 'not_paid' };

  const { access_code, selected_plan, cohort_number } = session.metadata ?? {};
  if (!access_code || !selected_plan) return { error: 'missing_metadata' };

  const db = createServiceClient();

  // ── Check idempotency — code already used means we already processed ──────
  const { data: codeRecord } = await db
    .from('access_codes')
    .select('email, used_at, is_active')
    .eq('code', access_code)
    .maybeSingle();

  if (!codeRecord) return { error: 'invalid_code' };
  if (codeRecord.used_at) {
    // Already processed — just send to dashboard
    return { alreadyProcessed: true };
  }

  const email         = codeRecord.email.toLowerCase().trim();
  const stripeCustomerId = typeof session.customer === 'string'
    ? session.customer
    : session.customer?.id ?? null;
  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id ?? null;

  // ── Look up beta_applications for user details ────────────────────────────
  const { data: app } = await db
    .from('beta_applications')
    .select('full_name')
    .eq('email', email)
    .maybeSingle();

  const fullName = app?.full_name ?? email;

  // ── Create Supabase auth user if not exists ───────────────────────────────
  const { data: existingUser } = await db.auth.admin.listUsers();
  const authUser = existingUser?.users.find((u) => u.email === email);

  let userId: string;
  if (authUser) {
    userId = authUser.id;
  } else {
    const { data: created, error: createErr } = await db.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (createErr || !created.user) {
      console.error('[activate/success] createUser error:', createErr);
      return { error: 'user_creation_failed' };
    }
    userId = created.user.id;
  }

  // ── Plan pricing ──────────────────────────────────────────────────────────
  const foundingPrice  = selected_plan === 'growth' ? 299.00 : 99.00;
  const publicPriceVal = selected_plan === 'growth' ? 349.00 : 149.00;
  const lockedUntil    = new Date();
  lockedUntil.setMonth(lockedUntil.getMonth() + 6);

  // ── Upsert public.users ───────────────────────────────────────────────────
  await db.from('users').upsert({
    id:                 userId,
    email,
    company_name:       null,
    plan_tier:          selected_plan,
    is_admin:           false,
    founding_member:    true,
    price_locked_until: lockedUntil.toISOString(),
    founding_price:     foundingPrice,
    public_price:       publicPriceVal,
    stripe_customer_id: stripeCustomerId,
    subscription_id:    subscriptionId,
    subscription_status: 'active',
    country:            'CA',
  }, { onConflict: 'id' });

  // ── Update beta_applications ──────────────────────────────────────────────
  await db
    .from('beta_applications')
    .update({
      stripe_customer_id: stripeCustomerId,
      activated_at:       new Date().toISOString(),
      status:             'accepted',
    })
    .eq('email', email);

  // ── Mark access code used ─────────────────────────────────────────────────
  await db
    .from('access_codes')
    .update({
      used_at:   new Date().toISOString(),
      is_active: false,
    })
    .eq('code', access_code);

  // ── Increment cohort spots_filled + auto-close if full ────────────────────
  const cohortNum = parseInt(cohort_number ?? '1', 10);
  const { data: cohortRow } = await db
    .from('cohort_config')
    .select('spots_filled, max_spots')
    .eq('cohort_number', cohortNum)
    .maybeSingle();

  if (cohortRow) {
    const newFilled = cohortRow.spots_filled + 1;
    await db
      .from('cohort_config')
      .update({
        spots_filled:  newFilled,
        cohort_status: newFilled >= cohortRow.max_spots ? 'full' : undefined,
        updated_at:    new Date().toISOString(),
      })
      .eq('cohort_number', cohortNum);
  }

  // ── Generate magic login link and send welcome email ──────────────────────
  const redirectTo = `${config.siteUrl}/dashboard?welcome=1&plan=${selected_plan}&price=${foundingPrice}`;
  const { data: linkData } = await db.auth.admin.generateLink({
    type:        'magiclink',
    email,
    options:     { redirectTo },
  });

  const loginUrl = linkData?.properties?.action_link ?? `${config.siteUrl}/login`;

  void sendWelcomeEmail({
    toEmail:       email,
    fullName,
    plan:          selected_plan,
    foundingPrice,
    lockedUntil,
    loginUrl,
  }).catch((e) => console.error('[activate/success] Email error:', e));

  return { success: true };
}

export default async function ActivateSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  if (!session_id) redirect('/activate');

  const result = await processActivation(session_id);

  if (result.error === 'not_paid') redirect('/activate');
  if (result.alreadyProcessed || result.success) {
    // Show success — user checks email for login link
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b px-6 py-4">
        <p className="text-sm font-semibold">Mercorama</p>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6 py-16">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">Payment confirmed.</h1>

          <p className="text-muted-foreground leading-relaxed">
            Your Mercorama account is ready.
            Check your inbox — we've sent you a login link.
          </p>

          <p className="text-sm text-muted-foreground">
            The link expires in 24 hours. If it doesn't arrive within a few minutes,
            check your spam folder or{' '}
            <a href="mailto:team@mercorama.com" className="underline hover:text-foreground">
              contact us
            </a>.
          </p>

        </div>
      </main>
    </div>
  );
}
