// app/api/admin/experts/bookings/route.ts
// Admin view: all expert bookings across the platform
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';
import { ADMIN_EMAILS } from '@/lib/admin';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = createServiceClient();

  // All bookings with expert + session + user info
  const { data: bookings } = await db
    .from('expert_bookings')
    .select(`
      id, status, scheduled_at, amount_cents, currency, created_at, user_id,
      stripe_checkout_session_id, stripe_payment_intent_id,
      expert_profiles!expert_bookings_expert_id_fkey(headline, slug, expert_code),
      expert_session_types!expert_bookings_session_type_id_fkey(title, duration_minutes)
    `)
    .order('created_at', { ascending: false })
    .limit(200);

  // Enrich with user emails
  const enriched = await Promise.all(
    (bookings ?? []).map(async (b) => {
      let clientEmail = 'Unknown';
      try {
        const { data } = await db.auth.admin.getUserById(b.user_id);
        clientEmail = data?.user?.email ?? 'Unknown';
      } catch {}
      return {
        ...b,
        client_email: clientEmail,
        expert: b.expert_profiles,
        session: b.expert_session_types,
      };
    }),
  );

  // Summary stats
  const total = enriched.length;
  const confirmed = enriched.filter((b) => b.status === 'confirmed').length;
  const pending = enriched.filter((b) => b.status === 'pending').length;
  const revenue = enriched
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + b.amount_cents, 0);

  return NextResponse.json({
    bookings: enriched,
    stats: { total, confirmed, pending, revenue },
  });
}
