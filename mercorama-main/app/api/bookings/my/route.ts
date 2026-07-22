// app/api/bookings/my/route.ts
// Returns the authenticated user's bookings (upcoming + past).
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  const { data: bookings, error } = await db
    .from('expert_bookings')
    .select(`
      id, status, scheduled_at, amount_cents, currency, created_at, notes,
      expert_profiles!expert_bookings_expert_id_fkey(headline, slug, avatar_url),
      expert_session_types!expert_bookings_session_type_id_fkey(title, duration_minutes)
    `)
    .eq('user_id', user.id)
    .order('scheduled_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[mercorama] my bookings error:', error);
    return NextResponse.json({ error: 'Failed to load bookings' }, { status: 500 });
  }

  const now = new Date().toISOString();
  const upcoming = (bookings ?? [])
    .filter((b) => b.scheduled_at >= now && b.status !== 'cancelled')
    .map(formatBooking);
  const past = (bookings ?? [])
    .filter((b) => b.scheduled_at < now || b.status === 'cancelled')
    .map(formatBooking);

  return NextResponse.json({ upcoming, past });
}

function formatBooking(b: Record<string, unknown>) {
  return {
    id: b.id,
    status: b.status,
    scheduled_at: b.scheduled_at,
    amount_cents: b.amount_cents,
    currency: b.currency,
    expert: b.expert_profiles,
    session: b.expert_session_types,
  };
}
