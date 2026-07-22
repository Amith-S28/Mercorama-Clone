import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const usdaFreightSchema = z.array(
  z.object({
    year: z.string().optional(),
    month: z.string().optional(),
    container_size: z.string().optional(),
    origin: z.string().optional(),
    destination_country: z.string().optional(),
    rate: z.string().optional(),
    date: z.string().optional(),
  })
);

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.searchParams.get('origin') ?? 'CAN';
  const destination = request.nextUrl.searchParams.get('destination') ?? 'USA';

  let baseRateUsd = 1000;
  let dateString = '';
  let dataOrigin = 'mock-fallback';

  try {
    const res = await fetch('https://agtransport.usda.gov/resource/dtp5-fwp8.json?$order=date DESC&$limit=20', {
      next: { revalidate: 86400 } // Cache for 24 hours
    });
    
    if (res.ok) {
      const rawData = await res.json();
      const parsedData = usdaFreightSchema.safeParse(rawData);
      
      if (parsedData.success) {
        // Find the latest 40ft container rate
        const record = parsedData.data.find(r => r.container_size === '40ft container');
        if (record && record.rate) {
          baseRateUsd = parseFloat(record.rate) || baseRateUsd;
          dateString = record.date || '';
          dataOrigin = 'live-usda-agtransport';
        }
      }
    }
  } catch (err) {
    console.error('Failed to fetch ocean freight rates from USDA AgTransport:', err);
  }

  // Define route multiplier mapping relative to the US-Shanghai base lane
  const multiplierMap: Record<string, number> = {
    JPN: 1.1,
    DEU: 3.5,
    GBR: 3.5,
    BRA: 2.5,
    ZAF: 4.0,
    IND: 2.2,
    USA: 0.8,
    CAN: 0.8,
  };

  const destKey = destination.toUpperCase();
  const multiplier = multiplierMap[destKey] ?? 2.0;

  // Convert USD to CAD (assuming 1.35 CAD per USD)
  const usdToCadFactor = 1.35;
  const rawCadRate = baseRateUsd * multiplier * usdToCadFactor;
  const containerRateCad = Math.round(rawCadRate);

  return NextResponse.json({
    origin,
    destination,
    containerRateCad,
    transitDays: destKey === 'JPN' ? 18 : destKey === 'DEU' || destKey === 'GBR' ? 24 : 28,
    mode: 'ocean-feu',
    dataOrigin,
    metadata: {
      usdaBaseRateUsd: baseRateUsd,
      usdaRateDate: dateString,
      usdToCadExchangeApplied: usdToCadFactor,
      laneMultiplier: multiplier,
    }
  }, { headers: { 'data-origin': dataOrigin } });
}
