import { NextRequest, NextResponse } from 'next/server';
import { withMockFallback } from '@/lib/api-client';
import { mockTariffPayload } from '@/lib/mock-fallback-data';

export async function GET(request: NextRequest) {
  const hsCode = request.nextUrl.searchParams.get('hsCode') ?? '000000';
  const country = request.nextUrl.searchParams.get('country') ?? 'USA';

  const { data, origin } = await withMockFallback(
    'usitc',
    async () => {
      const url = `https://hts.usitc.gov/reststop/search?keyword=${hsCode}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`USITC HTTP ${res.status}`);
      const payload = await res.json();
      return {
        ...mockTariffPayload(hsCode, country),
        jurisdiction: 'US',
        payload,
      };
    },
    () => ({ ...mockTariffPayload(hsCode, country), jurisdiction: 'US', payload: null }),
    true
  );

  return NextResponse.json(data, { headers: { 'data-origin': origin } });
}
