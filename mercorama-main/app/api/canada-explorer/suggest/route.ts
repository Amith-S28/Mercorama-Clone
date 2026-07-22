// app/api/canada-explorer/suggest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { runIntelligenceLayer } from '@/lib/intelligence/orchestrator';
import type { CanadaMarketResult } from '@/lib/types/mercorama-growth';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `You are a Canadian market expansion advisor for SMEs.

Return a JSON array of exactly 4 Canadian province expansion opportunities ranked by fit.
Do not include the user's current market in results.

Each object:
{"province":"name","demandLevel":"high|medium|low","targetChannels":["ch1","ch2"],"recommendedEntryStrategy":"entry approach","keyBuyersOrRetailers":["buyer1"],"logisticsComplexity":"low|medium|high","competitionLevel":"high|medium|low","rationale":"one insight"}

Use provided knowledge to justify recommendations. Do not generate generic answers.`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { productDescription, priceRange, currentMarket, exportExperience } = body;

  if (!productDescription) {
    return NextResponse.json({ error: 'productDescription required' }, { status: 400 });
  }

  const userPrompt = `Product: ${productDescription}
Price range: ${priceRange ?? 'Not specified'}
Current market: ${currentMarket ?? 'Not specified'}
Export experience: ${exportExperience ?? 'Not specified'}

Return exactly 4 province objects as a JSON array. Start with [ and end with ].`;

  try {
    const intelligence = await runIntelligenceLayer<CanadaMarketResult[]>({
      layer: 'market',
      stage: 'exploring',
      context: { product: productDescription, category: productDescription },
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
    });

    const parsed = Array.isArray(intelligence.data) ? intelligence.data : [];
    const sanitized = parsed.map((m) => ({
      province: m.province ?? '',
      demandLevel: m.demandLevel ?? 'medium',
      demandDrivers: Array.isArray(m.demandDrivers) ? m.demandDrivers : [],
      targetChannels: Array.isArray(m.targetChannels) ? m.targetChannels : [],
      recommendedEntryStrategy: m.recommendedEntryStrategy ?? '',
      keyBuyersOrRetailers: Array.isArray(m.keyBuyersOrRetailers) ? m.keyBuyersOrRetailers : [],
      pricingPositioning: (m.pricingPositioning as string) ?? 'mid-range',
      logisticsComplexity: m.logisticsComplexity ?? 'medium',
      competitionLevel: m.competitionLevel ?? 'medium',
      rationale: m.rationale ?? '',
    }));

    return NextResponse.json(sanitized);
  } catch (err) {
    console.error('[mercorama] canada-explorer failed:', err);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
