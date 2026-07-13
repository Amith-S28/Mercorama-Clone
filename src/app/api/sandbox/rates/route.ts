import { NextRequest, NextResponse } from 'next/server';
import { withMockFallback } from '@/lib/api-client';
import { env, isServiceConfigured } from '@/lib/env';
import { mockRatesPayload } from '@/lib/mock-fallback-data';

export async function GET(request: NextRequest) {
  const base = request.nextUrl.searchParams.get('base') ?? 'CAD';
  const target = request.nextUrl.searchParams.get('target') ?? 'USD';

  const { data, origin } = await withMockFallback(
    'exchange_rate',
    async () => {
      const url = `https://api.exchangerate.host/convert?from=${base}&to=${target}`;
      const res = await fetch(url, {
        headers: env.EXCHANGE_RATE_API_KEY
          ? { Authorization: `Bearer ${env.EXCHANGE_RATE_API_KEY}` }
          : {},
      });
      if (!res.ok) throw new Error(`Rates HTTP ${res.status}`);
      const payload = (await res.json()) as { result?: number };
      const fallback = mockRatesPayload(base, target);
      return {
        base: fallback.base,
        target: fallback.target,
        rate: payload.result ?? fallback.rate,
        volatility30d: fallback.volatility30d,
        volatility90d: fallback.volatility90d,
      };
    },
    () => {
      const fallback = mockRatesPayload(base, target);
      return {
        base: fallback.base,
        target: fallback.target,
        rate: fallback.rate,
        volatility30d: fallback.volatility30d,
        volatility90d: fallback.volatility90d,
      };
    },
    isServiceConfigured('EXCHANGE_RATE_API_KEY')
  );

  return NextResponse.json(data, { headers: { 'data-origin': origin } });
}
