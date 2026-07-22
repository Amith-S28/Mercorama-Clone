// app/api/freight-connect/reveal/route.ts
// PRIVACY: sole endpoint that reveals SME identity to a forwarder.
import { NextRequest, NextResponse } from 'next/server';
import { supabase, createServiceClient } from '@/lib/supabase';
import { revealSmeIdentity } from '@/lib/freightConnectQuotes';
import { sendIdentityRevealedToForwarder } from '@/lib/freightConnectEmails';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { quote_request_id } = await req.json() as { quote_request_id: string };
    if (!quote_request_id) {
      return NextResponse.json({ error: 'quote_request_id required' }, { status: 400 });
    }

    // Reveal in DB
    await revealSmeIdentity(quote_request_id, user.id);

    // Fetch quote + forwarder contact + SME profile for notification email
    const db = createServiceClient();
    const [quoteRes, smeRes] = await Promise.all([
      db
        .from('quote_requests')
        .select('forwarder_id, target_market')
        .eq('id', quote_request_id)
        .single(),
      db
        .from('users')
        .select('email, company_name')
        .eq('id', user.id)
        .maybeSingle(),
    ]);

    const quote = quoteRes.data;

    const { data: ff } = await db
      .from('freight_forwarders')
      .select('company_name, primary_contact_email')
      .eq('id', quote?.forwarder_id)
      .single();

    // Send identity reveal notification to forwarder
    if (ff?.primary_contact_email) {
      sendIdentityRevealedToForwarder({
        toEmail:        ff.primary_contact_email,
        companyName:    ff.company_name,
        smeCompanyName: smeRes?.data?.company_name ?? 'The shipper',
        smeEmail:       smeRes?.data?.email ?? user.email ?? '',
        targetMarket:   quote?.target_market ?? '—',
        quoteRequestId: quote_request_id,
      }).catch(() => {/* non-fatal */});
    }

    return NextResponse.json({ revealed: true });
  } catch (err) {
    console.error('[FC reveal] error:', err);
    return NextResponse.json({ error: 'Identity reveal failed' }, { status: 500 });
  }
}
