// app/api/bookings/accept-proposal/route.ts
// User accepts a proposal → creates Stripe Checkout or confirms if free.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { config } from '@/lib/config';

export const runtime = 'nodejs';

const BOARD_URL = process.env.NEXT_PUBLIC_BOARD_URL ?? 'https://board.mercorama.com';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { proposal_id } = await req.json();
  if (!proposal_id) return NextResponse.json({ error: 'proposal_id required' }, { status: 400 });

  const db = createServiceClient();

  // Fetch proposal + request
  const { data: proposal } = await db
    .from('expert_proposals')
    .select('*, expert_requests!expert_proposals_request_id_fkey(id, user_id, expert_id)')
    .eq('id', proposal_id)
    .maybeSingle();

  if (!proposal) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });

  const request = proposal.expert_requests as { id: string; user_id: string; expert_id: string };
  if (request.user_id !== user.id) return NextResponse.json({ error: 'Not your request' }, { status: 403 });

  // Mark proposal as accepted
  await db.from('expert_proposals').update({ is_accepted: true }).eq('id', proposal_id);
  await db.from('expert_requests').update({ status: 'accepted' }).eq('id', request.id);

  // Free proposal → confirmed immediately
  if (proposal.price_cents === 0) {
    return NextResponse.json({ status: 'accepted', redirect_url: `${BOARD_URL}/dashboard/requests` });
  }

  // Paid → Stripe Checkout
  if (!config.stripeSecretKey) {
    return NextResponse.json({ status: 'accepted', note: 'Payment not configured' });
  }

  const { data: expert } = await db.from('expert_profiles').select('headline, slug').eq('id', request.expert_id).maybeSingle();

  const stripe = new Stripe(config.stripeSecretKey);
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: (proposal.currency ?? 'CAD').toLowerCase(),
        product_data: {
          name: proposal.title,
          description: `Engagement with ${expert?.headline?.split('—')[0]?.trim() ?? 'Expert'}`,
        },
        unit_amount: proposal.price_cents,
      },
      quantity: 1,
    }],
    metadata: {
      proposal_id,
      request_id: request.id,
      expert_id: request.expert_id,
      user_id: user.id,
    },
    success_url: `${BOARD_URL}/dashboard/requests?payment=success`,
    cancel_url: `${BOARD_URL}/dashboard/requests?payment=cancelled`,
  });

  return NextResponse.json({ status: 'accepted', checkout_url: checkoutSession.url });
}
