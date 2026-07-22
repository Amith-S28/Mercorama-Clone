// lib/intelligence/retrieval.ts
// Knowledge loader — structured injection for each intelligence layer.
// Phase 2: add vector retrieval alongside structured knowledge.

import type { IntelligenceLayer, IntelligenceStage, IntelligenceContext } from './types';

export async function getKnowledgeContext(
  layer: IntelligenceLayer,
  _stage: IntelligenceStage,
  context: IntelligenceContext,
): Promise<string> {
  const blocks: string[] = [];

  // HS knowledge — for hs and compliance layers
  if (layer === 'hs' || layer === 'compliance') {
    const { findRelevantHSKnowledge } = await import('@/lib/hs/knowledge');
    const knowledge = findRelevantHSKnowledge(context.product ?? context.category ?? '');
    if (knowledge) blocks.push(knowledge);
  }

  // Incoterm knowledge — for incoterm and compliance layers
  if (layer === 'incoterm' || layer === 'compliance') {
    const { buildIncotermContext } = await import('@/lib/incoterm/knowledge');
    const knowledge = buildIncotermContext(context.incoterm ?? '');
    if (knowledge) blocks.push(knowledge);
  }

  // Market knowledge — for market, compliance, and hs layers (when country is set)
  if (layer === 'market' || layer === 'compliance' || (layer === 'hs' && context.country)) {
    const { getMarketContext } = await import('@/lib/market/knowledge');
    // Search by product (category rules) + country (trade context)
    const productKnowledge = getMarketContext(context.product ?? context.category ?? '');
    const countryKnowledge = context.country ? getMarketContext(context.country) : '';
    const combined = [productKnowledge, countryKnowledge].filter(Boolean).join('\n\n');
    if (combined) blocks.push(combined);
  }

  // Compliance knowledge (future)
  if (layer === 'compliance') {
    try {
      const compliance = await import('@/lib/compliance/knowledge');
      const knowledge = compliance.getComplianceContext(context);
      if (knowledge) blocks.push(knowledge);
    } catch {
      // compliance knowledge module not yet implemented
    }
  }

  // TODO: integrate vector search (Phase 3)
  // const vectorResults = await searchEmbeddings(layer, context);
  // if (vectorResults) blocks.push(vectorResults);

  return blocks.filter(Boolean).join('\n\n');
}
