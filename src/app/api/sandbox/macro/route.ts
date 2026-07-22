import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withMockFallback } from '@/lib/api-client';

const wbResponseSchema = z.tuple([
  z.object({
    page: z.number(),
    pages: z.number(),
    per_page: z.number(),
    total: z.number(),
  }),
  z.array(
    z.object({
      indicator: z.object({ id: z.string(), value: z.string() }),
      country: z.object({ id: z.string(), value: z.string() }),
      countryiso3code: z.string(),
      date: z.string(),
      value: z.number().nullable(),
      unit: z.string(),
      obs_status: z.string(),
      decimal: z.number(),
    })
  ).nullable(),
]);

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get('country') ?? 'USA';

  const { data, origin } = await withMockFallback(
    'macro',
    async () => {
      const gdpUrl = `https://api.worldbank.org/v2/country/${country}/indicator/NY.GDP.MKTP.CD?format=json&per_page=5`;
      const inflationUrl = `https://api.worldbank.org/v2/country/${country}/indicator/FP.CPI.TOTL.ZG?format=json&per_page=5`;

      const [gdpRes, inflationRes] = await Promise.all([
        fetch(gdpUrl, { next: { revalidate: 86400 } }),
        fetch(inflationUrl, { next: { revalidate: 86400 } }),
      ]);

      if (!gdpRes.ok || !inflationRes.ok) {
        throw new Error('World Bank API failed');
      }

      const gdpRaw = await gdpRes.json();
      const inflationRaw = await inflationRes.json();

      const gdpParsed = wbResponseSchema.safeParse(gdpRaw);
      const inflationParsed = wbResponseSchema.safeParse(inflationRaw);

      let gdpValue = null;
      let gdpYear = null;
      if (gdpParsed.success && gdpParsed.data[1]) {
        const validGdp = gdpParsed.data[1].find((d) => d.value !== null);
        if (validGdp) {
          gdpValue = validGdp.value;
          gdpYear = validGdp.date;
        }
      }

      let inflationValue = null;
      let inflationYear = null;
      if (inflationParsed.success && inflationParsed.data[1]) {
        const validInf = inflationParsed.data[1].find((d) => d.value !== null);
        if (validInf) {
          inflationValue = validInf.value;
          inflationYear = validInf.date;
        }
      }

      return {
        country,
        gdpUsd: gdpValue,
        gdpYear,
        inflationPct: inflationValue,
        inflationYear,
        dataOrigin: 'live',
      };
    },
    () => {
      // Fallback
      return {
        country,
        gdpUsd: 2000000000000,
        gdpYear: '2022',
        inflationPct: 3.5,
        inflationYear: '2022',
        dataOrigin: 'mock-fallback',
      };
    },
    true // World bank API doesn't need an API key for basic indicators, so we assume it's always configured
  );

  return NextResponse.json(data, { headers: { 'data-origin': origin } });
}
