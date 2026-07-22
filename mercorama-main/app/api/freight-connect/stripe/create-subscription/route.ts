// app/api/freight-connect/stripe/create-subscription/route.ts
// Creates a Stripe Checkout session for a forwarder tier upgrade
import { NextRequest, NextResponse } from 'next/server';
import { createSubscriptionCheckout } from '@/lib/freightConnectBilling';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      forwarder_id:       string;
      tier:               'verified' | 'featured';
      billing_period:     'monthly' | 'annual';
      is_founding_partner: boolean;
    };

    const { forwarder_id, tier, billing_period, is_founding_partner } = body;

    if (!forwarder_id || !tier || !billing_period) {
      return NextResponse.json({ error: 'forwarder_id, tier and billing_period are required' }, { status: 400 });
    }

    if (!['verified', 'featured'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    if (!['monthly', 'annual'].includes(billing_period)) {
      return NextResponse.json({ error: 'Invalid billing_period' }, { status: 400 });
    }

    const checkoutUrl = await createSubscriptionCheckout(
      forwarder_id,
      tier,
      billing_period,
      is_founding_partner ?? false
    );

    return NextResponse.json({ url: checkoutUrl });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Checkout creation failed';
    console.error('[FC create-subscription] error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
