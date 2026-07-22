// app/api/hscode/classify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callClaudeWithRetry, parseClaudeJSON } from '@/lib/claude';
import { runIntelligenceLayer } from '@/lib/intelligence/orchestrator';
import { validateHsCode } from '@/lib/hs/validator';

const SYSTEM_PROMPT = `You are a certified customs classification specialist with expertise in the Harmonized System (HS) nomenclature, WCO General Rules of Interpretation (GRI), and international trade compliance.

Given a product description and optional trade corridor, you must produce a JSON classification dossier.

STRICT RULES:
1. Respond with ONLY valid JSON inside a \`\`\`json code fence — no commentary before or after.
2. Classify to 6 digits minimum; extend to 8–10 digits where the product clearly warrants it (e.g., US HTS, EU CN).
3. Use real WCO HS 2022 headings. Do not invent codes.
4. indentAnalysis must walk through the classification from Chapter level down to final subheading — 3 to 5 entries.
5. supportingRulings may be plausible CBP/HMRC/CITT ruling references; mark jurisdiction clearly.
6. duty.estimatedRate: provide an approximate Most Favoured Nation (MFN) rate for the destination country if known; otherwise "Unknown — verify with national tariff schedule".
7. confidenceScore must be a float 0.00–1.00.

OUTPUT SCHEMA (follow exactly):
\`\`\`json
{
  "selectedCode": {
    "code": "XXXX.XX.XXXX",
    "description": "WCO heading description",
    "confidenceScore": 0.00,
    "confidenceLevel": "High",
    "griBasis": ["GRI 1"],
    "mercoramaReasoning": "Paragraph explaining the classification decision."
  },
  "references": {
    "supportingRulings": [
      { "id": "NY A12345", "url": "", "jurisdiction": "US CBP" }
    ],
    "notesCited": ["Note X to Chapter XX — ..."]
  },
  "attestation": {
    "standardizedItemDescription": "Precise customs-ready product description.",
    "descriptionQuality": "High",
    "descriptionComments": ["Comment on description completeness."]
  },
  "indentAnalysis": [
    {
      "level": 1,
      "heading": "XXXX",
      "title": "Chapter/Heading title",
      "analysis": "Why this level applies."
    }
  ],
  "risk": {
    "overallRiskLevel": "Low",
    "misclassificationRisks": ["Risk description."],
    "recommendedEvidence": ["Evidence to retain."]
  },
  "duty": {
    "destinationCountry": null,
    "estimatedRate": null,
    "basis": null,
    "notes": null
  }
}
\`\`\``;

function buildUserPrompt(
  description: string,
  originCountry: string | null,
  destinationCountry: string | null
): string {
  const lines = [
    `Product description: ${description}`,
    originCountry ? `Origin country: ${originCountry}` : 'Origin country: Not specified',
    destinationCountry
      ? `Destination country: ${destinationCountry}`
      : 'Destination country: Not specified',
    '',
    'Produce the full HS classification dossier JSON for this product.',
  ];
  return lines.join('\n');
}

export async function POST(req: NextRequest) {
  let body: { description?: unknown; originCountry?: unknown; destinationCountry?: unknown };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const description = typeof body.description === 'string' ? body.description.trim() : '';
  if (!description || description.length < 5) {
    return NextResponse.json(
      { error: 'description is required and must be at least 5 characters' },
      { status: 400 }
    );
  }

  const originCountry =
    typeof body.originCountry === 'string' && body.originCountry.trim()
      ? body.originCountry.trim()
      : null;
  const destinationCountry =
    typeof body.destinationCountry === 'string' && body.destinationCountry.trim()
      ? body.destinationCountry.trim()
      : null;

  try {
    const intelligence = await runIntelligenceLayer<Record<string, unknown>>({
      layer: 'hs',
      stage: 'exploring',
      context: {
        product: description,
        country: destinationCountry ?? undefined,
      },
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildUserPrompt(description, originCountry, destinationCountry),
    });

    const result = intelligence.data;
    if (!result.selectedCode || !result.risk || !result.duty) {
      return NextResponse.json(
        { error: 'AI response was incomplete. Please try again.' },
        { status: 400 },
      );
    }

    // Layer 1: validate AI-generated HS code against WCO HS 2022 reference
    const selectedCode = result.selectedCode as Record<string, unknown>;
    const rawCode = typeof selectedCode?.code === 'string' ? selectedCode.code : '';
    const validation = validateHsCode(rawCode);

    if (validation.status === 'verified') {
      selectedCode.codeVerified = true;
      selectedCode.codeSource = 'WCO HS 2022';
    } else {
      selectedCode.codeVerified = false;
      selectedCode.codeWarning =
        validation.status === 'format_error'
          ? 'HS code format is invalid — verify before use'
          : 'HS code not found in WCO HS 2022 reference — verify before use';
      if (validation.nearest?.length) {
        selectedCode.nearestValidCodes = validation.nearest;
      }
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('[mercorama] HS classify — unexpected error:', error);
    return NextResponse.json(
      { error: 'Classification failed. Please try again.' },
      { status: 500 },
    );
  }
}
