// app/api/studio/bookings/route.ts — Expert's incoming bookings
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  const { data: profile } = await db.from('expert_profiles').select('id').eq('user_id', user.id).maybeSingle();
  if (!profile) return NextResponse.json({ error: 'Not an expert' }, { status: 403 });

  const { data: bookings } = await db
    .from('expert_bookings')
    .select(`
      id, status, scheduled_at, amount_cents, currency, notes, created_at, user_id,
      expert_session_types!expert_bookings_session_type_id_fkey(title, duration_minutes)
    `)
    .eq('expert_id', profile.id)
    .order('scheduled_at', { ascending: false })
    .limit(100);

  // Get user emails for each booking
  const enriched = await Promise.all(
    (bookings ?? []).map(async (b) => {
      const { data: userData } = await db.auth.admin.getUserById(b.user_id);
      return {
        id: b.id,
        status: b.status,
        scheduled_at: b.scheduled_at,
        amount_cents: b.amount_cents,
        currency: b.currency,
        notes: b.notes,
        created_at: b.created_at,
        client_email: userData?.user?.email ?? 'Unknown',
        session: b.expert_session_types,
      };
    }),
  );

  return NextResponse.json(enriched);
}
