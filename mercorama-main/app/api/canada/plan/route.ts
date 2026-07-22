// app/api/canada/plan/route.ts
// Generates a Canada go-to-market plan using province intelligence data.
import { NextRequest, NextResponse } from 'next/server';
import { runIntelligenceLayer } from '@/lib/intelligence/orchestrator';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `You are a Canadian retail market entry advisor for SMEs.

Generate a Canada go-to-market plan for a product entering a specific province.

Respond with this exact JSON structure:
{
  "provinceName": "<province>",
  "productSummary": "<one sentence: This product is [ready/well-suited/competitive] for [province] because...>",
  "retailStrategy": {
    "phase1": [
      {"chain": "<retail chain name>", "rationale": "<why enter here first>", "timeline": "<e.g. Month 1-3>"}
    ],
    "phase2": [
      {"chain": "<retail chain name>", "rationale": "<why expand here>", "timeline": "<e.g. Month 4-8>"}
    ]
  },
  "distributorStrategy": {
    "recommended": [
      {"name": "<distributor name>", "model": "<broker_distributor or direct_to_retail>", "rationale": "<why this distributor>"}
    ],
    "approach": "<1-2 sentences on overall distribution approach>"
  },
  "pricingGuidance": "<2-3 sentences on pricing strategy for this province>",
  "regulatorySteps": ["<specific regulatory step>", "<specific regulatory step>"],
  "timeline": [
    {"milestone": "<specific milestone>", "timeframe": "<e.g. Month 1>"}
  ],
  "risks": ["<specific risk with consequence>"],
  "investmentEstimate": "<2-3 sentences on estimated budget range for market entry>"
}

Rules:
- Output JSON only. No prose, no markdown, no code fences.
- Use ONLY the retail chains and distributors provided in the context — do not invent names.
- Be specific to the province and product. No generic advice.
- retailStrategy.phase1: 2-3 chains for initial entry.
- retailStrategy.phase2: 1-2 chains for scaling after phase 1.
- distributorStrategy.recommended: 1-2 distributors.
- regulatorySteps: 3-5 specific steps.
- timeline: 5-7 milestones.
- risks: 3-4 specific risks.
- investmentEstimate must include a CAD dollar range.`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { province, product, population, gdp, consumerProfile, retailChains, distributors, intelligence, entryStrategy, competition, regulatory } = body;

  if (!province || !product) {
    return NextResponse.json({ error: 'province and product required' }, { status: 400 });
  }

  const userPrompt = `Generate a Canada go-to-market plan for:

Product: ${product}
Province: ${province}
Population: ${population ? Number(population).toLocaleString() : 'Unknown'}
GDP: $${gdp ?? '?'}B
Consumer Profile: ${JSON.stringify(consumerProfile ?? {})}
Available Retail Chains: ${retailChains || 'Unknown'}
Available Distributors: ${distributors || 'Unknown'}
Market Intelligence: ${intelligence || 'No intelligence available'}
Recommended Entry Strategy: ${entryStrategy || 'Not specified'}
Competition Level: ${competition || 'Unknown'}
Regulatory Notes: ${regulatory || 'Unknown'}

Use ONLY the retail chains and distributors listed above. Do not invent others.`;

  try {
    const result = await runIntelligenceLayer<Record<string, unknown>>({
      layer: 'market',
      stage: 'exploring',
      context: { product, province, category: product },
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
    });

    return NextResponse.json(result.data);
  } catch (err) {
    console.error('[mercorama] canada/plan failed:', err);
    return NextResponse.json({ error: 'Plan generation failed' }, { status: 500 });
  }
}
