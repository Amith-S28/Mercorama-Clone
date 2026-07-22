// app/api/freight-connect/claim/route.ts
// Forwarder claims an unclaimed listing: saves profile, attaches Stripe payment method, transitions to claimed
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { claimForwarder, getForwarder } from '@/lib/freightConnect';
import { savePaymentMethod } from '@/lib/freightConnectBilling';
import { sendForwarderWelcomeEmail } from '@/lib/freightConnectEmails';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      forwarder_id:          string;
      contact_name:          string;
      contact_email:         string;
      website_url?:          string;
      description?:          string;
      provinces:             string[];
      lanes:                 string[];
      hs_chapters:           string[];
      shipping_modes:        string[];
      logo_url?:             string;
      stripe_customer_id:    string;
      stripe_payment_method_id: string;
    };

    const {
      forwarder_id,
      contact_name,
      contact_email,
      website_url,
      description,
      provinces,
      lanes,
      hs_chapters,
      shipping_modes,
      logo_url,
      stripe_customer_id,
      stripe_payment_method_id,
    } = body;

    if (!forwarder_id || !contact_name || !contact_email || !stripe_customer_id || !stripe_payment_method_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify forwarder exists and is unclaimed
    const existing = await getForwarder(forwarder_id);
    if (!existing) {
      return NextResponse.json({ error: 'Forwarder not found' }, { status: 404 });
    }
    if (existing.state !== 'unclaimed') {
      return NextResponse.json({ error: 'listing_already_claimed' }, { status: 409 });
    }

    // Save Stripe payment method as default
    await savePaymentMethod(forwarder_id, stripe_customer_id, stripe_payment_method_id);

    // Update profile fields before transitioning state
    const db = createServiceClient();
    await db
      .from('freight_forwarders')
      .update({
        website_url:   website_url   ?? existing.website_url,
        description:   description   ?? existing.description,
        provinces:     provinces.length  > 0 ? provinces     : existing.provinces,
        lanes:         lanes.length       > 0 ? lanes         : existing.lanes,
        hs_chapters:   hs_chapters.length > 0 ? hs_chapters  : existing.hs_chapters,
        shipping_modes: shipping_modes.length > 0 ? shipping_modes : existing.shipping_modes,
        logo_url:      logo_url ?? existing.logo_url,
      })
      .eq('id', forwarder_id);

    // Transition state: unclaimed → claimed
    const forwarder = await claimForwarder(
      forwarder_id,
      contact_name,
      contact_email,
      stripe_customer_id
    );

    // Send welcome email (best-effort)
    sendForwarderWelcomeEmail({
      toEmail:     contact_email,
      companyName: forwarder.company_name,
      forwarderId: forwarder_id,
    }).catch((e) => console.error('[FC claim] welcome email failed:', e));

    return NextResponse.json({ forwarder_id, state: forwarder.state, claimed_at: forwarder.claimed_at });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Claim failed';
    console.error('[FC claim] error:', err);

    if (msg === 'listing_already_claimed' || msg.includes('already claimed')) {
      return NextResponse.json({ error: 'listing_already_claimed' }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
