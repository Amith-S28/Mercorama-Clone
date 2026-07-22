// app/api/freight-connect/forwarder/me/route.ts
// Returns the forwarder record for the logged-in user (matched by primary_contact_email)
import { NextResponse } from 'next/server';
import { supabase, createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = createServiceClient();

    const { data: ff, error } = await db
      .from('freight_forwarders')
      .select('*')
      .eq('primary_contact_email', user.email)
      .maybeSingle();

    if (error) throw error;
    if (!ff) return NextResponse.json({ error: 'no_forwarder_found' }, { status: 404 });

    // Fetch active subscription
    const { data: sub } = await db
      .from('forwarder_subscriptions')
      .select('*')
      .eq('forwarder_id', ff.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ forwarder: ff, subscription: sub ?? null });

  } catch (err) {
    console.error('[FC forwarder/me] error:', err);
    return NextResponse.json({ error: 'Failed to load forwarder profile' }, { status: 500 });
  }
}
