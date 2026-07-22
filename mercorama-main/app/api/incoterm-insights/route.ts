// app/api/incoterm-insights/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { runIntelligenceLayer } from '@/lib/intelligence/orchestrator';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `You are an Incoterms 2020 expert advising a Canadian SME exporter.

Respond with this exact JSON structure and nothing else:
{
  "recommended": "<Incoterm code e.g. FCA>",
  "rationale": "<two sentences explaining the recommendation>",
  "riskLevel": "<low or medium or high>",
  "marginImpact": "<one sentence on margin or cost impact for seller>",
  "responsibilitySplit": {
    "seller": ["<responsibility 1>", "<responsibility 2>"],
    "buyer": ["<responsibility 1>", "<responsibility 2>"]
  },
  "warning": "<one sentence warning if applicable, or empty string>"
}

Rules:
- Output JSON only. No prose before or after.
- No markdown. No code fences. No explanation outside the JSON.
- Start your response with { and end with }.
- All string values must use double quotes.
- Never use null — use empty string "" or empty array [].
- riskLevel must be exactly one of: low, medium, high.
- seller and buyer must always be arrays with at least one item.`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { incoterm, productDescription, buyerCountry, unitPrice, quantity, currency } = body;

  if (!incoterm || !productDescription) {
    return NextResponse.json({ error: 'incoterm and productDescription required' }, { status: 400 });
  }

  const dealValue = (unitPrice ?? 0) * (quantity ?? 1);

  const userPrompt = `Incoterm: ${incoterm}
Product: ${productDescription}
Buyer Country: ${buyerCountry ?? 'Not specified'}
Deal Value: ${currency ?? 'CAD'} ${dealValue.toLocaleString()}`;

  try {
    const result = await runIntelligenceLayer({
      layer: 'incoterm',
      stage: 'exploring',
      context: {
        incoterm,
        product: productDescription,
        country: buyerCountry,
        price: dealValue,
      },
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
    });
    return NextResponse.json(result.data);
  } catch (err) {
    console.error('[mercorama] incoterm-insights failed:', err);
    return NextResponse.json({
      recommended: incoterm, rationale: 'Analysis unavailable',
      riskLevel: 'medium', marginImpact: 'Unknown',
      responsibilitySplit: { seller: [], buyer: [] },
      warning: '',
    });
  }
}
