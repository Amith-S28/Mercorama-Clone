import { NextRequest, NextResponse } from 'next/server';
import { withMockFallback } from '@/lib/api-client';
import { env, isServiceConfigured } from '@/lib/env';
import { mockTariffPayload } from '@/lib/mock-fallback-data';

interface TariffRecord {
  Year?: number;
  Value?: number;
}

interface WTOApiResponse {
  Dataset?: TariffRecord[];
}

export async function GET(request: NextRequest) {
  const hsCode = request.nextUrl.searchParams.get('hsCode') ?? '000000';
  const country = request.nextUrl.searchParams.get('country') ?? 'USA';

  const { data, origin } = await withMockFallback(
    'tariffs',
    async () => {
      // WTO Tariff Download Database API URL
      const url = `https://api.wto.org/timeseries/v1/data?reporter=CAN&partner=${country}&cmd=${hsCode}&flow=M`;

      const res = await fetch(url, {
        headers: env.WTO_API_KEY ? { 'Ocp-Apim-Subscription-Key': env.WTO_API_KEY } : {},
      });
      if (!res.ok) throw new Error(`WTO Tariffs HTTP ${res.status}`);
      const payload = (await res.json()) as WTOApiResponse;
      const fallback = mockTariffPayload(hsCode, country);
      
      const dataset = payload?.Dataset ?? [];
      let rate = fallback.rate;
      if (dataset.length > 0) {
        // Sort by Year descending to get the latest available tariff rate
        const sorted = [...dataset].sort((a: TariffRecord, b: TariffRecord) => (b.Year || 0) - (a.Year || 0));
        const latest = sorted[0];
        if (latest && typeof latest.Value === 'number') {
          // Value is in percent (e.g. 5.0), convert to decimal (e.g. 0.05)
          rate = latest.Value / 100;
        }
      }

      return {
        ...fallback,
        rate,
        preferentialRate: Math.max(0, rate - 0.03),
        dataOrigin: 'live' as 'live' | 'mock-fallback',
        payload,
      };
    },
    () => ({ ...mockTariffPayload(hsCode, country), payload: null } as Record<string, unknown>),
    isServiceConfigured('WTO_API_KEY')
  );

  return NextResponse.json(data, { headers: { 'data-origin': origin } });
}
