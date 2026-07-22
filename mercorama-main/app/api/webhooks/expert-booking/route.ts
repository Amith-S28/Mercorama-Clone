// app/api/webhooks/expert-booking/route.ts
// Stripe webhook: confirms booking after successful payment.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import Stripe from 'stripe';
import { config } from '@/lib/config';

export const runtime = 'nodejs';

// Stripe sends raw body — disable Next.js body parsing
export const dynamic = 'force-dynamic';

const WEBHOOK_SECRET = process.env.STRIPE_EXPERT_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET ?? '';

export async function POST(req: NextRequest) {
  if (!config.stripeSecretKey || !WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const stripe = new Stripe(config.stripeSecretKey);
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error('[mercorama] expert-booking webhook signature error:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.booking_id;

    if (!bookingId) {
      console.warn('[mercorama] expert-booking webhook: no booking_id in metadata');
      return NextResponse.json({ received: true });
    }

    const db = createServiceClient();

    // Update booking status to confirmed
    const { error: updateErr } = await db
      .from('expert_bookings')
      .update({
        status: 'confirmed',
        stripe_payment_intent_id: session.payment_intent as string,
      })
      .eq('id', bookingId)
      .eq('status', 'pending');

    if (updateErr) {
      console.error('[mercorama] expert-booking webhook: failed to confirm booking:', updateErr);
      return NextResponse.json({ error: 'Failed to confirm' }, { status: 500 });
    }

    console.log(`[mercorama] expert-booking confirmed: ${bookingId}`);

    // Send confirmation emails (best-effort)
    try {
      await sendBookingConfirmationEmails(db, bookingId);
    } catch (emailErr) {
      console.error('[mercorama] expert-booking webhook: email send failed:', emailErr);
      // Don't fail the webhook — booking is already confirmed
    }
  }

  return NextResponse.json({ received: true });
}

async function sendBookingConfirmationEmails(
  db: ReturnType<typeof createServiceClient>,
  bookingId: string,
) {
  if (!config.resendApiKey) return;

  const { data: booking } = await db
    .from('expert_bookings')
    .select(`
      id, scheduled_at, amount_cents, currency, notes,
      expert_profiles!expert_bookings_expert_id_fkey(headline, user_id),
      expert_session_types!expert_bookings_session_type_id_fkey(title, duration_minutes),
      user_id
    `)
    .eq('id', bookingId)
    .maybeSingle();

  if (!booking) return;

  // Get user email
  const { data: userData } = await db.auth.admin.getUserById(booking.user_id);
  const userEmail = userData?.user?.email;
  if (!userEmail) return;

  const expertProfile = booking.expert_profiles as Record<string, unknown>;
  const sessionType = booking.expert_session_types as Record<string, unknown>;
  const date = new Date(booking.scheduled_at as string);
  const dateStr = date.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' });

  const { Resend } = await import('resend');
  const resend = new Resend(config.resendApiKey);

  // Email to user
  await resend.emails.send({
    from: config.resendFromEmail,
    to: userEmail,
    subject: `Booking Confirmed — ${sessionType.title} with ${(expertProfile.headline as string).split('—')[0].trim()}`,
    html: `
      <h2>Your session is confirmed</h2>
      <p><strong>${sessionType.title}</strong></p>
      <p>${dateStr} at ${timeStr} · ${sessionType.duration_minutes} minutes</p>
      <p>Amount: ${(booking.amount_cents as number) === 0 ? 'Free' : `$${((booking.amount_cents as number) / 100).toFixed(0)} ${booking.currency}`}</p>
      <br/>
      <p>Prepare any questions or documents you'd like to discuss. A reminder will be sent before your session.</p>
      <br/>
      <p style="color: #666; font-size: 12px;">This session is for informational purposes only. Mercorama facilitates discovery — not customs brokerage or legal advice.</p>
    `,
  });

  // Email to expert (if they have a user account)
  if (expertProfile.user_id) {
    const { data: expertUser } = await db.auth.admin.getUserById(expertProfile.user_id as string);
    const expertEmail = expertUser?.user?.email;
    if (expertEmail) {
      await resend.emails.send({
        from: config.resendFromEmail,
        to: expertEmail,
        subject: `New Booking — ${sessionType.title}`,
        html: `
          <h2>You have a new booking</h2>
          <p><strong>${sessionType.title}</strong></p>
          <p>${dateStr} at ${timeStr} · ${sessionType.duration_minutes} minutes</p>
          <p>Client: ${userEmail}</p>
          ${booking.notes ? `<p>Notes: ${JSON.stringify(booking.notes)}</p>` : ''}
          <br/>
          <p>Log into your Mercorama Studio to view booking details.</p>
        `,
      });
    }
  }
}
