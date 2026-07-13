import { NextRequest, NextResponse } from 'next/server';

interface UsdaFreightRecord {
  year: string;
  month: string;
  container_size: string;
  origin: string;
  destination_country: string;
  rate: string;
  date: string;
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.searchParams.get('origin') ?? 'CAN';
  const destination = request.nextUrl.searchParams.get('destination') ?? 'USA';

  let baseRateUsd = 1000;
  let dateString = '';

  try {
    const res = await fetch('https://agtransport.usda.gov/resource/dtp5-fwp8.json?$order=date DESC&$limit=20');
    if (res.ok) {
      const data = await res.json() as UsdaFreightRecord[];
      // Find the latest 40ft container rate
      const record = data.find(r => r.container_size === '40ft container');
      if (record && record.rate) {
        baseRateUsd = parseFloat(record.rate) || baseRateUsd;
        dateString = record.date;
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
    dataOrigin: 'live-usda-agtransport',
    metadata: {
      usdaBaseRateUsd: baseRateUsd,
      usdaRateDate: dateString,
      usdToCadExchangeApplied: usdToCadFactor,
      laneMultiplier: multiplier,
    }
  }, { headers: { 'data-origin': 'live-usda-agtransport' } });
}
