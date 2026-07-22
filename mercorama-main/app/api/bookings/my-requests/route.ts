// app/api/bookings/my-requests/route.ts
// Returns the authenticated user's consultation requests + any proposals received.
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();

  const { data: requests } = await db
    .from('expert_requests')
    .select(`
      id, status, engagement_type, description, target_market,
      timeline, budget_range, contact_email, created_at, updated_at,
      expert_profiles!expert_requests_expert_id_fkey(headline, slug, avatar_url)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch proposals for each request
  const enriched = await Promise.all(
    (requests ?? []).map(async (r) => {
      const { data: proposals } = await db
        .from('expert_proposals')
        .select('id, title, deliverables, timeline, price_cents, currency, message, is_accepted, created_at')
        .eq('request_id', r.id)
        .order('created_at', { ascending: false });

      return {
        ...r,
        expert: r.expert_profiles,
        proposals: proposals ?? [],
      };
    }),
  );

  return NextResponse.json(enriched);
}
