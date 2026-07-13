import { NextRequest, NextResponse } from 'next/server';
import { withMockFallback } from '@/lib/api-client';
import { env, isServiceConfigured } from '@/lib/env';
import { mockComtradePayload, getWitsCountryTrend } from '@/lib/mock-fallback-data';
import { ISO3_TO_COMTRADE_NUMERIC } from '@/lib/countries';
import { getCachedComtrade, setCachedComtrade } from '@/lib/comtrade-cache';
import fs from 'fs';
import path from 'path';

const COMTRADE_NUMERIC_TO_ISO3: Record<string, string> = Object.entries(ISO3_TO_COMTRADE_NUMERIC).reduce(
  (acc, [iso3, num]) => {
    acc[num] = iso3;
    return acc;
  },
  {} as Record<string, string>
);

interface ComtradeRecord {
  partnerCode: number;
  partnerDesc?: string;
  primaryValue: number;
  period: number;
}

interface ComtradeResponse {
  data?: ComtradeRecord[];
}

interface HistoricalRecord {
  country: string;
  hsCode: string;
  year: number;
  partnerCountry: string;
  importValueUsd: number;
}

function loadHistoricalTradeData(): HistoricalRecord[] {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'historical_trade.csv');
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) return [];

    const records: HistoricalRecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      const fields = lines[i].split(',').map(f => f.trim());
      if (fields.length < 5) continue;
      records.push({
        country: fields[0],
        hsCode: fields[1],
        year: Number(fields[2]),
        partnerCountry: fields[3],
        importValueUsd: Number(fields[4]),
      });
    }
    return records;
  } catch (error) {
    console.error('Error loading historical trade data:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const hsCode = request.nextUrl.searchParams.get('hsCode') ?? '000000';
  const country = request.nextUrl.searchParams.get('country') ?? 'USA';
  const type = request.nextUrl.searchParams.get('type') ?? 'summary';
  const numericCode = ISO3_TO_COMTRADE_NUMERIC[country.toUpperCase()] ?? '842';

  const cacheKey = `${numericCode}:${hsCode}:${type}`;
  const cached = getCachedComtrade(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { 'data-origin': 'cache' } });
  }

  const { data, origin } = await withMockFallback(
    'comtrade',
    async () => {
      let url = '';
      if (type === 'trend') {
        url = `https://comtradeapi.un.org/data/v1/get/C/A/HS?reporterCode=${numericCode}&period=2019,2020,2021,2022,2023,2024&cmdCode=${hsCode}&flowCode=M&partnerCode=0&motCode=0&customsCode=C00&includeDesc=true`;
      } else if (type === 'partners') {
        url = `https://comtradeapi.un.org/data/v1/get/C/A/HS?reporterCode=${numericCode}&period=2024&cmdCode=${hsCode}&flowCode=M&partnerCode=all&motCode=0&customsCode=C00&includeDesc=true`;
      } else {
        url = `https://comtradeapi.un.org/data/v1/get/C/A/HS?reporterCode=${numericCode}&period=2024&cmdCode=${hsCode}&flowCode=M&partnerCode=0&motCode=0&customsCode=C00&includeDesc=true`;
      }

      const res = await fetch(url, {
        headers: env.COMTRADE_API_KEY ? { 'Ocp-Apim-Subscription-Key': env.COMTRADE_API_KEY } : {},
      });
      if (!res.ok) throw new Error(`Comtrade HTTP ${res.status}`);
      const payload = (await res.json()) as ComtradeResponse;
      
      let processedData: unknown = payload;
      
      if (type === 'summary') {
        const fallback = mockComtradePayload(hsCode, country);
        const liveVolume = payload?.data?.[0]?.primaryValue;
        processedData = {
          ...fallback,
          importVolumeUsd: typeof liveVolume === 'number' ? liveVolume : fallback.importVolumeUsd,
          dataOrigin: 'live',
          payload,
        };
      } else if (type === 'partners') {
        // Find top 10 partners, excluding world (0)
        const partners = (payload?.data || [])
          .filter((d: ComtradeRecord) => d.partnerCode !== 0)
          .sort((a: ComtradeRecord, b: ComtradeRecord) => b.primaryValue - a.primaryValue)
          .slice(0, 10)
          .map((d: ComtradeRecord) => ({
            country: COMTRADE_NUMERIC_TO_ISO3[String(d.partnerCode)] ?? d.partnerDesc ?? 'Unknown',
            value: d.primaryValue,
          }));
        processedData = { partners, dataOrigin: 'live' };
      } else if (type === 'trend') {
        const trend = (payload?.data || [])
          .filter((d: ComtradeRecord) => d.partnerCode === 0)
          .sort((a: ComtradeRecord, b: ComtradeRecord) => a.period - b.period)
          .map((d: ComtradeRecord) => ({
            year: d.period,
            value: d.primaryValue,
          }));
        processedData = { trend, dataOrigin: 'live' };
      }

      setCachedComtrade(cacheKey, processedData);
      return processedData;
    },
    () => {
      // 1. Try to load from historical CSV database
      const historicalRecords = loadHistoricalTradeData().filter(
        r => r.country.toUpperCase() === country.toUpperCase() && r.hsCode === hsCode
      );

      if (historicalRecords.length > 0) {
        if (type === 'summary') {
          const record2024 = historicalRecords.find(r => r.year === 2024 && r.partnerCountry === 'World');
          const record2023 = historicalRecords.find(r => r.year === 2023 && r.partnerCountry === 'World');
          const volume = record2024 ? record2024.importValueUsd : 0;
          let yoy = 0.05; // Fallback YoY
          if (record2024 && record2023 && record2023.importValueUsd > 0) {
            yoy = (record2024.importValueUsd - record2023.importValueUsd) / record2023.importValueUsd;
          }
          const profileFallback = mockComtradePayload(hsCode, country);
          return {
            hsCode,
            country,
            importVolumeUsd: volume,
            yoyChange: yoy,
            dataOrigin: 'historical-offline',
            competitors: [],
            seasonality: profileFallback.seasonality,
            payload: null,
          };
        }
        
        if (type === 'partners') {
          const partners = historicalRecords
            .filter(r => r.year === 2024 && r.partnerCountry !== 'World')
            .sort((a, b) => b.importValueUsd - a.importValueUsd)
            .map(r => ({
              country: r.partnerCountry,
              value: r.importValueUsd,
            }));
          return { partners, dataOrigin: 'historical-offline' };
        }
        
        if (type === 'trend') {
          const trend = historicalRecords
            .filter(r => r.partnerCountry === 'World')
            .sort((a, b) => a.year - b.year)
            .map(r => ({
              year: r.year,
              value: r.importValueUsd,
            }));
          return { trend, dataOrigin: 'historical-offline' };
        }
      }

      // 2. Dynamic mock generation fallback if not in historical dataset
      const fallback = mockComtradePayload(hsCode, country);
      if (type === 'summary') return { ...fallback, payload: null };
      if (type === 'partners') return { partners: fallback.competitors.map(c => ({ country: c.country, value: (c.sharePct / 100) * fallback.importVolumeUsd })), dataOrigin: 'mock-fallback' };
      if (type === 'trend') {
        const witsTrend = getWitsCountryTrend(country);
        if (witsTrend.length > 0) {
          const latestValue = witsTrend[witsTrend.length - 1]?.value || 1;
          const ratio = fallback.importVolumeUsd / latestValue;
          return {
            trend: witsTrend.map(t => ({ year: t.year, value: Math.round(t.value * ratio) })),
            dataOrigin: 'mock-fallback',
          };
        }
        return { trend: [{ year: 2022, value: fallback.importVolumeUsd * 0.9 }, { year: 2023, value: fallback.importVolumeUsd * 0.95 }, { year: 2024, value: fallback.importVolumeUsd }], dataOrigin: 'mock-fallback' };
      }
      return { dataOrigin: 'mock-fallback' };
    },
    isServiceConfigured('COMTRADE_API_KEY')
  );

  return NextResponse.json(data, { headers: { 'data-origin': origin } });
}
