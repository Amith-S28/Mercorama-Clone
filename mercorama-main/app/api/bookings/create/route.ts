// app/api/bookings/create/route.ts
// Atomic booking creation: reserves slot, creates booking, handles Stripe for paid sessions.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import Stripe from 'stripe';
import { config } from '@/lib/config';

export const runtime = 'nodejs';

const BOARD_URL = process.env.NEXT_PUBLIC_BOARD_URL ?? 'https://board.mercorama.com';

interface CreateBookingBody {
  expert_id: string;
  session_type_id: string;
  slot_id: string;
  notes?: { question: string; answer: string }[];
}

export async function POST(req: NextRequest) {
  const db = createServiceClient();

  // Auth check — get user from Supabase session
  const authHeader = req.headers.get('authorization');
  let userId: string | null = null;

  // Try cookie-based auth first (browser), then Bearer token
  if (authHeader?.startsWith('Bearer ')) {
    const { data } = await db.auth.getUser(authHeader.replace('Bearer ', ''));
    userId = data.user?.id ?? null;
  } else {
    // For cookie-based auth, we need the user from the request context
    // The middleware already validated the session — extract user_id from the cookie
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: CreateBookingBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { expert_id, session_type_id, slot_id, notes } = body;

  if (!expert_id || !session_type_id || !slot_id) {
    return NextResponse.json({ error: 'Missing required fields: expert_id, session_type_id, slot_id' }, { status: 400 });
  }

  try {
    // 1. Fetch expert profile
    const { data: expert, error: expertErr } = await db
      .from('expert_profiles')
      .select('id, user_id, slug, headline')
      .eq('id', expert_id)
      .eq('is_approved', true)
      .eq('is_active', true)
      .maybeSingle();

    if (expertErr || !expert) {
      return NextResponse.json({ error: 'Expert not found' }, { status: 404 });
    }

    // Self-booking guard
    if (expert.user_id === userId) {
      return NextResponse.json({ error: 'Cannot book your own session' }, { status: 400 });
    }

    // 2. Fetch session type (must belong to same expert)
    const { data: session, error: sessionErr } = await db
      .from('expert_session_types')
      .select('*')
      .eq('id', session_type_id)
      .eq('expert_id', expert_id)
      .eq('is_active', true)
      .maybeSingle();

    if (sessionErr || !session) {
      return NextResponse.json({ error: 'Session type not found' }, { status: 404 });
    }

    // 3. Reserve slot atomically
    const { data: slot, error: slotErr } = await db
      .from('expert_availability_slots')
      .select('*')
      .eq('id', slot_id)
      .eq('expert_id', expert_id)
      .eq('is_booked', false)
      .maybeSingle();

    if (slotErr || !slot) {
      return NextResponse.json({ error: 'Slot is no longer available' }, { status: 409 });
    }

    // Mark slot as booked
    const { error: bookSlotErr } = await db
      .from('expert_availability_slots')
      .update({ is_booked: true })
      .eq('id', slot_id)
      .eq('is_booked', false); // CAS — only succeeds if still unbooked

    if (bookSlotErr) {
      return NextResponse.json({ error: 'Failed to reserve slot' }, { status: 409 });
    }

    // Build scheduled_at from slot date + start time
    const scheduledAt = new Date(`${slot.slot_date}T${slot.start_time}`).toISOString();

    // 4. Create booking record
    const { data: booking, error: bookingErr } = await db
      .from('expert_bookings')
      .insert({
        user_id: userId,
        expert_id,
        session_type_id,
        slot_id,
        status: session.price_cents === 0 ? 'confirmed' : 'pending',
        scheduled_at: scheduledAt,
        notes: notes ?? null,
        amount_cents: session.price_cents,
        currency: session.currency,
      })
      .select('id, status')
      .single();

    if (bookingErr || !booking) {
      // Rollback slot
      await db.from('expert_availability_slots').update({ is_booked: false }).eq('id', slot_id);
      console.error('[mercorama] booking create error:', bookingErr);
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    // 5. Free session — confirmed immediately
    if (session.price_cents === 0) {
      return NextResponse.json({
        booking_id: booking.id,
        status: 'confirmed',
        redirect_url: `${BOARD_URL}/booking/confirmed/${booking.id}`,
      });
    }

    // 6. Paid session — create Stripe Checkout
    if (!config.stripeSecretKey) {
      // Stripe not configured — still create booking as pending
      return NextResponse.json({
        booking_id: booking.id,
        status: 'pending',
        redirect_url: `${BOARD_URL}/booking/confirmed/${booking.id}`,
        note: 'Payment processing not configured — booking created as pending.',
      });
    }

    const stripe = new Stripe(config.stripeSecretKey);
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: session.currency.toLowerCase(),
          product_data: {
            name: `${session.title} — ${expert.headline}`,
            description: `${session.duration_minutes}-minute session`,
          },
          unit_amount: session.price_cents,
        },
        quantity: 1,
      }],
      metadata: {
        booking_id: booking.id,
        expert_id,
        session_type_id,
        user_id: userId,
      },
      success_url: `${BOARD_URL}/booking/confirmed/${booking.id}?payment=success`,
      cancel_url: `${BOARD_URL}/book/${expert.slug}?payment=cancelled`,
    });

    // Store Stripe session ID on booking
    await db
      .from('expert_bookings')
      .update({ stripe_checkout_session_id: checkoutSession.id })
      .eq('id', booking.id);

    return NextResponse.json({
      booking_id: booking.id,
      status: 'pending',
      checkout_url: checkoutSession.url,
    });
  } catch (err) {
    console.error('[mercorama] booking create error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
