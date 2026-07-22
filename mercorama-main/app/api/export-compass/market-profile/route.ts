// app/api/export-compass/market-profile/route.ts
// GET /api/export-compass/market-profile?hs=030614&country=USA&product=lobster
// Returns DeepMarketProfile JSON (7-day cache in api_cache).
import { NextRequest, NextResponse } from 'next/server';
import { getDeepMarketProfile }      from '@/lib/market-profile';

export const runtime    = 'nodejs';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const hs      = req.nextUrl.searchParams.get('hs')?.replace(/\./g, '').slice(0, 6);
  const country = req.nextUrl.searchParams.get('country');
  const product = req.nextUrl.searchParams.get('product') ?? 'this product';

  if (!hs || !country) {
    return NextResponse.json({ error: 'hs and country are required' }, { status: 400 });
  }

  try {
    const profile = await getDeepMarketProfile(hs, country, product);
    return NextResponse.json(profile);
  } catch (err) {
    console.error('[market-profile] Error:', err);
    return NextResponse.json(
      { error: 'Failed to assemble market profile' },
      { status: 500 }
    );
  }
}
