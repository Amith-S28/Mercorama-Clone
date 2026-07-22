// lib/intelligence/orchestrator.ts
// Unified Intelligence Orchestrator — single entry point for all AI-powered analysis.

import { getKnowledgeContext } from './retrieval';
import { routeModel } from './router';
import { extractJSON } from '@/lib/claude';
import type {
  IntelligenceLayer,
  IntelligenceStage,
  IntelligenceContext,
  IntelligenceResult,
} from './types';

export async function runIntelligenceLayer<T>({
  layer,
  stage,
  context,
  systemPrompt,
  userPrompt,
}: {
  layer: IntelligenceLayer;
  stage: IntelligenceStage;
  context: IntelligenceContext;
  systemPrompt: string;
  userPrompt?: string;
}): Promise<IntelligenceResult<T>> {
  const t0 = Date.now();

  const knowledge = await getKnowledgeContext(layer, stage, context);

  const knowledgeBlock = knowledge ? `\nRelevant knowledge:\n${knowledge}\n` : '';

  // Build the prompt — use system+user split for better JSON compliance
  const finalSystemPrompt = systemPrompt + knowledgeBlock + '\n\nReturn JSON only. No prose outside JSON. Start with { or [.';
  const finalPrompt = userPrompt ?? JSON.stringify(context);

  const { response, modelUsed } = await routeModel(stage, finalPrompt, finalSystemPrompt);
  const latencyMs = Date.now() - t0;

  let parsed: T;
  try {
    parsed = extractJSON<T>(response);
  } catch {
    // extractJSON failed — try raw parse
    try {
      parsed = JSON.parse(response);
    } catch {
      console.error(`[mercorama] orchestrator parse failed (${layer}/${stage}) in ${latencyMs}ms`);
      throw new Error(`Failed to parse ${layer} intelligence response`);
    }
  }

  console.log(JSON.stringify({
    event: 'intelligence',
    layer,
    stage,
    modelUsed,
    latencyMs,
    context: {
      product: context.product?.slice(0, 50),
      country: context.country,
      hsCode: context.hsCode,
      incoterm: context.incoterm,
    },
    knowledgeInjected: !!knowledge,
    time: new Date().toISOString(),
  }));

  return {
    layer,
    stage,
    data: parsed,
    metadata: {
      modelUsed,
      latencyMs,
      retrievalSources: knowledge ? ['structured'] : [],
    },
  };
}
