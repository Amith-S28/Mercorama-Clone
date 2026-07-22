// app/api/freight-connect/forwarder/respond/route.ts
// Forwarder submits a quote response.
// Resets consecutive_missed_responses. Sends "quote ready" email to SME (no PII).
import { NextRequest, NextResponse } from 'next/server';
import { supabase, createServiceClient } from '@/lib/supabase';
import { sendQuoteReceivedToSme } from '@/lib/freightConnectEmails';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json() as {
      quote_request_id: string;
      rate_estimate?:   string;
      transit_time?:    string;
      notes?:           string;
    };

    const { quote_request_id, rate_estimate, transit_time, notes } = body;
    if (!quote_request_id) {
      return NextResponse.json({ error: 'quote_request_id required' }, { status: 400 });
    }

    const db = createServiceClient();

    // Verify ownership: forwarder must match the email
    const { data: ff } = await db
      .from('freight_forwarders')
      .select('id, company_name, consecutive_missed_responses')
      .eq('primary_contact_email', user.email)
      .maybeSingle();

    if (!ff) return NextResponse.json({ error: 'no_forwarder_found' }, { status: 404 });

    const { data: quote } = await db
      .from('quote_requests')
      .select('id, state, forwarder_id, sme_user_id, target_market, shipping_mode, response_deadline')
      .eq('id', quote_request_id)
      .single();

    if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    if (quote.forwarder_id !== ff.id) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    if (quote.state !== 'pending') {
      return NextResponse.json({ error: `Quote is already ${quote.state}` }, { status: 409 });
    }

    const now = new Date().toISOString();

    // Insert structured response
    await db.from('quote_responses').insert({
      quote_request_id,
      forwarder_id:  ff.id,
      rate_estimate: rate_estimate ?? null,
      transit_time:  transit_time  ?? null,
      notes:         notes         ?? null,
    });

    // Update quote_requests: responded, reset freetext + counter
    await db
      .from('quote_requests')
      .update({
        state:                   'responded',
        forwarder_response_text: notes ?? `Rate: ${rate_estimate ?? '—'} · Transit: ${transit_time ?? '—'}`,
        responded_at:            now,
      })
      .eq('id', quote_request_id);

    // Reset consecutive missed responses
    await db
      .from('freight_forwarders')
      .update({ consecutive_missed_responses: 0 })
      .eq('id', ff.id);

    // Fetch SME email to notify (no PII in email body — just "quote ready")
    const { data: sme } = await db
      .from('users')
      .select('email')
      .eq('id', quote.sme_user_id)
      .maybeSingle();

    if (sme?.email) {
      sendQuoteReceivedToSme({
        toEmail:        sme.email,
        forwarderName:  ff.company_name,
        targetMarket:   quote.target_market,
        shippingMode:   quote.shipping_mode,
        rateEstimate:   rate_estimate,
        transitTime:    transit_time,
        quoteRequestId: quote_request_id,
      }).catch((e) => console.error('[FC respond] SME email failed:', e));
    }

    return NextResponse.json({ responded: true });

  } catch (err) {
    console.error('[FC forwarder/respond] error:', err);
    return NextResponse.json({ error: 'Response submission failed' }, { status: 500 });
  }
}
