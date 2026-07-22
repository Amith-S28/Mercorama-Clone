// app/api/freight-connect/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { searchForwarders } from '@/lib/freightConnect';
import type { ForwarderSearchParams, ShippingMode } from '@/lib/freightConnect';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<ForwarderSearchParams>;

    const params: ForwarderSearchParams = {
      target_market:  body.target_market,
      shipping_mode:  body.shipping_mode as ShippingMode | undefined,
      hs_chapter:     body.hs_chapter,
      province:       body.province,
      states:         body.states ?? ['unclaimed', 'claimed', 'verified', 'featured'],
      include_suspended: false,
      limit:          body.limit ?? 20,
      offset:         body.offset ?? 0,
    };

    const result = await searchForwarders(params);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[FC search] error:', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
