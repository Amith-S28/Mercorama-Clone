// app/api/bookings/[id]/route.ts
// Returns booking details for the confirmation page.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = createServiceClient();

  const { data: booking, error } = await db
    .from('expert_bookings')
    .select(`
      id, status, scheduled_at, amount_cents, currency, notes,
      expert_profiles!expert_bookings_expert_id_fkey(headline, slug, avatar_url),
      expert_session_types!expert_bookings_session_type_id_fkey(title, duration_minutes)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: booking.id,
    status: booking.status,
    scheduled_at: booking.scheduled_at,
    amount_cents: booking.amount_cents,
    currency: booking.currency,
    expert: booking.expert_profiles,
    session: booking.expert_session_types,
  });
}
