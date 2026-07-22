// app/api/freight-connect/stripe/setup-intent/route.ts
// Returns a Stripe SetupIntent clientSecret for saving a payment method during claim
import { NextRequest, NextResponse } from 'next/server';
import { createForwarderSetupIntent } from '@/lib/freightConnectBilling';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      forwarder_id:  string;
      company_name:  string;
      contact_email: string;
    };

    const { forwarder_id, company_name, contact_email } = body;

    if (!forwarder_id || !company_name || !contact_email) {
      return NextResponse.json({ error: 'forwarder_id, company_name and contact_email are required' }, { status: 400 });
    }

    const { clientSecret, customerId } = await createForwarderSetupIntent(
      forwarder_id,
      company_name,
      contact_email
    );

    return NextResponse.json({ clientSecret, customerId });

  } catch (err) {
    console.error('[FC setup-intent] error:', err);
    return NextResponse.json({ error: 'Failed to create setup intent' }, { status: 500 });
  }
}
