// app/api/enhance-hs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { runIntelligenceLayer } from '@/lib/intelligence/orchestrator';
import { lookupTariffRate } from '@/lib/tariff-rates';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `You are a GRI-trained customs classification expert.

Respond with this exact JSON structure and nothing else:
{
  "explanation": "<two sentences explaining why this HS code was selected>",
  "confidence": <number 0 to 100>,
  "riskFlags": ["<risk 1>", "<risk 2>"],
  "alternativeCodes": ["<HS code if applicable>"],
  "tradeImplications": {
    "tariffImpact": "<one sentence on tariff effect>",
    "complianceImpact": "<one sentence on compliance requirements>",
    "documentationImpact": "<one sentence on documentation requirements>"
  }
}

Rules:
- Output JSON only. No prose before or after.
- No markdown. No code fences. No explanation outside the JSON.
- Start your response with { and end with }.
- All string values must use double quotes.
- Never use null — use empty string "" or empty array [].
- riskFlags and alternativeCodes must always be arrays, even if empty.`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { hsCode, hsDescription, productDescription, destinationCountry } = body;

  if (!hsCode || !productDescription) {
    return NextResponse.json({ error: 'hsCode and productDescription required' }, { status: 400 });
  }

  const userPrompt = `Product: ${productDescription}
HS Code: ${hsCode}
HS Description: ${hsDescription ?? 'Not provided'}
Destination Country: ${destinationCountry ?? 'Not specified'}`;

  const tariffRate = destinationCountry ? lookupTariffRate(destinationCountry, hsCode) : null;

  try {
    const intelligence = await runIntelligenceLayer<Record<string, unknown>>({
      layer: 'hs',
      stage: 'exploring',
      context: { product: productDescription, hsCode, country: destinationCountry },
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
    });
    const result = intelligence.data;

    // Override AI-generated tariff with verified static data
    if (tariffRate) {
      const implications = (result.tradeImplications ?? {}) as Record<string, string>;
      implications.tariffImpact = `MFN: ${tariffRate.mfn}${tariffRate.preferential ? ` · Preferential (${tariffRate.agreementName}): ${tariffRate.preferential}` : ''}. Source: ${tariffRate.source}. Rate shown is indicative. Verify before shipment.`;
      result.tradeImplications = implications;
    } else if (result.tradeImplications) {
      const implications = result.tradeImplications as Record<string, string>;
      if (implications.tariffImpact) {
        implications.tariffImpact += ' — Rate shown is indicative. Verify with Canada Customs or destination country tariff schedule.';
      }
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error('[mercorama] enhance-hs failed:', err);
    return NextResponse.json({
      confidence: 0, explanation: 'Enhancement unavailable',
      alternativeCodes: [], riskFlags: [],
      tradeImplications: tariffRate ? { tariffImpact: `MFN: ${tariffRate.mfn}. Source: ${tariffRate.source}. Verify before shipment.` } : {},
      note: 'Enhancement unavailable',
    });
  }
}
