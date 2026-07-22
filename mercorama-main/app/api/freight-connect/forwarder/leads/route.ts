// app/api/freight-connect/forwarder/leads/route.ts
// Returns quote requests assigned to the current forwarder.
// Privacy: SME identity only included when user_identity_revealed = true.
import { NextResponse } from 'next/server';
import { supabase, createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = createServiceClient();

    const { data: ff } = await db
      .from('freight_forwarders')
      .select('id')
      .eq('primary_contact_email', user.email)
      .maybeSingle();

    if (!ff) return NextResponse.json({ error: 'no_forwarder_found' }, { status: 404 });

    const { data: leads, error } = await db
      .from('quote_requests')
      .select(`
        id, state, created_at, updated_at, responded_at,
        product_category, hs_chapter, origin_province, target_market,
        estimated_volume, shipping_mode, additional_notes,
        lead_tier, lead_fee, lead_charged, lead_refunded,
        forwarder_response_text, response_deadline,
        user_identity_revealed, user_reveal_at,
        is_bulk, bulk_group_id,
        sme_user_id
      `)
      .eq('forwarder_id', ff.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    // For revealed leads, fetch SME contact info from users table
    const revealedLeads = (leads ?? []).filter((l) => l.user_identity_revealed);
    const smeIds = [...new Set(revealedLeads.map((l) => l.sme_user_id))];

    let smeMap: Record<string, { email: string; company_name?: string }> = {};
    if (smeIds.length > 0) {
      const { data: smes } = await db
        .from('users')
        .select('id, email, company_name')
        .in('id', smeIds);
      for (const s of (smes ?? [])) {
        smeMap[s.id] = { email: s.email, company_name: s.company_name };
      }
    }

    // Strip sme_user_id, inject contact only if revealed
    const safeLeads = (leads ?? []).map(({ sme_user_id, ...lead }) => ({
      ...lead,
      sme_contact: lead.user_identity_revealed
        ? (smeMap[sme_user_id] ?? null)
        : null,
    }));

    return NextResponse.json({ leads: safeLeads, forwarder_id: ff.id });

  } catch (err) {
    console.error('[FC forwarder/leads] error:', err);
    return NextResponse.json({ error: 'Failed to load leads' }, { status: 500 });
  }
}
