import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { ISO3_TO_COMTRADE_NUMERIC } from '@/lib/countries';
import fs from 'fs';
import path from 'path';

const COMTRADE_NUMERIC_TO_ISO3: Record<string, string> = Object.entries(ISO3_TO_COMTRADE_NUMERIC).reduce(
  (acc, [iso3, num]) => {
    acc[num] = iso3;
    return acc;
  },
  {} as Record<string, string>
);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface ComtradeRecord {
  period: number;
  primaryValue: number;
  partnerCode: number;
  partnerDesc?: string;
}

interface ComtradeResponse {
  data?: ComtradeRecord[];
}

export async function POST(request: NextRequest) {
  if (!env.COMTRADE_API_KEY) {
    return NextResponse.json({ error: 'COMTRADE_API_KEY is not configured in .env.local' }, { status: 400 });
  }

  try {
    const { hsCode } = await request.json() as { hsCode: string };
    if (!hsCode || hsCode.length < 4) {
      return NextResponse.json({ error: 'Invalid or missing HS Code' }, { status: 400 });
    }

    const countries = ['JPN', 'USA', 'DEU', 'GBR', 'BRA'];
    const newRecords: string[] = [];

    for (const country of countries) {
      const numericCode = ISO3_TO_COMTRADE_NUMERIC[country];
      if (!numericCode) continue;

      // 1. Fetch Trend (2020-2024, partner = World)
      const trendUrl = `https://comtradeapi.un.org/data/v1/get/C/A/HS?reporterCode=${numericCode}&period=2020,2021,2022,2023,2024&cmdCode=${hsCode}&flowCode=M&partnerCode=0&motCode=0&customsCode=C00&includeDesc=true`;
      
      const trendRes = await fetch(trendUrl, {
        headers: { 'Ocp-Apim-Subscription-Key': env.COMTRADE_API_KEY },
      });
      
      if (trendRes.ok) {
        const payload = (await trendRes.json()) as ComtradeResponse;
        const data = payload?.data || [];
        for (const record of data) {
          newRecords.push(`${country},${hsCode},${record.period},World,${record.primaryValue}`);
        }
      }
      
      await sleep(1500); // Sleep to respect rate limits

      // 2. Fetch Partners (2024, partner = all)
      const partnersUrl = `https://comtradeapi.un.org/data/v1/get/C/A/HS?reporterCode=${numericCode}&period=2024&cmdCode=${hsCode}&flowCode=M&partnerCode=all&motCode=0&customsCode=C00&includeDesc=true`;
      
      const partnersRes = await fetch(partnersUrl, {
        headers: { 'Ocp-Apim-Subscription-Key': env.COMTRADE_API_KEY },
      });
      
      if (partnersRes.ok) {
        const payload = (await partnersRes.json()) as ComtradeResponse;
        const data = payload?.data || [];
        for (const record of data) {
          if (record.partnerCode === 0) continue;
          const partnerIso = COMTRADE_NUMERIC_TO_ISO3[String(record.partnerCode)] ?? record.partnerDesc ?? 'Unknown';
          newRecords.push(`${country},${hsCode},2024,${partnerIso},${record.primaryValue}`);
        }
      }
      
      await sleep(1500); // Sleep to respect rate limits
    }

    if (newRecords.length === 0) {
      return NextResponse.json({ error: 'No data retrieved from UN Comtrade. Key might be rate-limited or invalid.' }, { status: 500 });
    }

    // Write to historical_trade.csv (append or merge)
    const filePath = path.join(process.cwd(), 'src', 'data', 'historical_trade.csv');
    let existingContent = '';
    if (fs.existsSync(filePath)) {
      existingContent = fs.readFileSync(filePath, 'utf-8');
    }

    const header = 'country,hs_code,year,partner_country,import_value_usd';
    const lines = existingContent.split(/\r?\n/).filter(line => line.trim().length > 0 && !line.startsWith('country,'));

    // Filter out existing records for this hsCode to prevent duplicates
    const filteredLines = lines.filter(line => {
      const parts = line.split(',');
      return parts[1] !== hsCode;
    });

    const finalLines = [header, ...filteredLines, ...newRecords];
    fs.writeFileSync(filePath, finalLines.join('\n'), 'utf-8');

    return NextResponse.json({ success: true, message: `Successfully downloaded and updated actual trade dataset for HS Code ${hsCode}` });
  } catch (error: unknown) {
    console.error('Comtrade sync error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error during sync';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
