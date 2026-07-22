// app/api/freight-connect/quotes/route.ts
import { NextResponse } from 'next/server';
import { supabase, createServiceClient } from '@/lib/supabase';
import { getSmeQuotes } from '@/lib/freightConnectQuotes';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const quotes = await getSmeQuotes(user.id);

    // Attach forwarder display name + state for each quote
    const db = createServiceClient();
    const forwarderIds = [...new Set(quotes.map((q) => q.forwarder_id))];

    const { data: forwarders } = await db
      .from('freight_forwarders')
      .select('id, company_name, state, logo_url')
      .in('id', forwarderIds);

    const ffMap = new Map((forwarders ?? []).map((f) => [f.id, f]));

    const enriched = quotes.map((q) => ({
      ...q,
      forwarder: ffMap.get(q.forwarder_id) ?? null,
    }));

    return NextResponse.json({ quotes: enriched });
  } catch (err) {
    console.error('[FC quotes inbox] error:', err);
    return NextResponse.json({ error: 'Failed to load quotes' }, { status: 500 });
  }
}
