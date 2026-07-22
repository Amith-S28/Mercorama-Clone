// app/api/export-compass/prioritise/route.ts
// Stage 3 — "Which market first?" single Sonnet call.
// Uses Claude Sonnet per CLAUDE.md (multi-step trade strategy reasoning).
import { NextRequest, NextResponse } from 'next/server';
import { routeModel } from '@/lib/intelligence/router';

export const runtime    = 'nodejs';
export const maxDuration = 30;

export interface ShortlistedMarketPayload {
  country:              string;
  exportScore:          number;
  demandScore:          number;
  marketAccessScore:    number;
  riskScore:            number;
  importValueUSD:       string;  // formatted string from card
  cagr5yr:              string;  // formatted string from card
  canadaExportValue:    string;  // formatted string from card
  tariffRate:           string;  // formatted string from card
  ftaName:              string | null;
  riskFlags:            string[];
}

export async function POST(req: NextRequest) {
  let body: {
    markets:  ShortlistedMarketPayload[];
    product:  string;
    hsCode:   string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { markets, product, hsCode } = body;

  if (!markets || markets.length < 2) {
    return NextResponse.json(
      { error: 'At least 2 shortlisted markets required' },
      { status: 400 }
    );
  }

  const system = `You are a senior Canadian trade advisor helping an SME choose their first export market. \
Use ONLY the structured data provided. Do NOT invent or estimate numbers.`;

  const marketJson = JSON.stringify(markets, null, 2);

  const user = `The SME exports ${product}${hsCode ? ` (HS ${hsCode})` : ''}. \
They have shortlisted ${markets.length} markets. Using the data below, recommend ONE market to enter first.

Respond in this exact structure:
## Recommended First Market: [Country]

### Why this market first
- [3–5 bullets, each citing a specific data point from the provided data]

### What to do next
- [2–3 concrete, actionable steps for a Canadian SME]

### Why not the others (briefly)
- [1 bullet per other market, citing a specific reason from the data]

Data:
${marketJson}`;

  try {
    const { response: recommendation } = await routeModel('exploring', user);

    // Extract recommended market from heading
    const match = recommendation.match(/##\s*Recommended First Market:\s*(.+)/);
    const recommendedMarket = match?.[1]?.trim() ?? markets[0].country;

    return NextResponse.json({ recommendation, recommendedMarket });
  } catch (err) {
    console.error('[prioritise] Claude error:', err);
    return NextResponse.json(
      { error: 'AI recommendation unavailable. Compare your markets manually above.' },
      { status: 503 }
    );
  }
}
