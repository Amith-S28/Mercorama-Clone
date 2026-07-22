// lib/incoterm/intelligence.ts
// Unified Incoterm Intelligence — single orchestrator for all Incoterm logic.
// Routes to SLM (Ollama) for quick suggestions, Claude for analysis/execution.

import { callLocalSLM, callClaudeHaiku, extractJSON } from '@/lib/claude';
import { buildIncotermContext } from './knowledge';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface IncotermIntelligenceResult {
  recommendedTerm: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  sellerResponsibilities: string[];
  buyerResponsibilities: string[];
  riskLevel: 'low' | 'medium' | 'high';
  marginImpact?: string;
  commonMistakes?: string[];
}

export interface IncotermContext {
  product?: string;
  price?: number;
  shipmentType?: string;
  destination?: string;
  incoterm?: string;  // if already selected
}

export type IncotermStage = 'early' | 'exploring' | 'execution';

// ── Stage 1: Quick SLM suggestion (Ollama) ────────────────────────────────────

async function quickSuggestion(ctx: IncotermContext): Promise<IncotermIntelligenceResult> {
  const prompt = `You are a trade terms advisor. For a ${ctx.product ?? 'general product'} shipping to ${ctx.destination ?? 'an international market'}, suggest the best Incoterm in 2 sentences. Include the term code and why.`;

  try {
    const raw = await callLocalSLM(prompt);
    // SLM returns prose, not JSON — extract recommendation
    const termMatch = raw.match(/\b(EXW|FCA|FAS|FOB|CFR|CIF|CPT|CIP|DAP|DPU|DDP)\b/);
    const term = termMatch?.[0] ?? 'FCA';
    return {
      recommendedTerm: term,
      confidence: 'medium',
      reasoning: raw.slice(0, 200),
      sellerResponsibilities: [],
      buyerResponsibilities: [],
      riskLevel: 'medium',
    };
  } catch {
    // Fallback: rule-based
    const term = (ctx.price ?? 0) >= 50000 ? 'CIP' : 'FCA';
    return {
      recommendedTerm: term,
      confidence: 'low',
      reasoning: `${term} is a common choice for this type of shipment.`,
      sellerResponsibilities: [],
      buyerResponsibilities: [],
      riskLevel: 'medium',
    };
  }
}

// ── Stage 2: Guided analysis (Claude Haiku) ───────────────────────────────────

async function guidedAnalysis(ctx: IncotermContext): Promise<IncotermIntelligenceResult> {
  const knowledgeCtx = ctx.incoterm ? buildIncotermContext(ctx.incoterm) : '';

  const prompt = `You are an Incoterms 2020 expert advising a Canadian SME.
${knowledgeCtx ? `\nReference knowledge: ${knowledgeCtx}\n` : ''}
Product: ${ctx.product ?? 'Not specified'}
Destination: ${ctx.destination ?? 'Not specified'}
Shipment type: ${ctx.shipmentType ?? 'Container'}
Value: ${ctx.price ? `$${ctx.price.toLocaleString()}` : 'Not specified'}
${ctx.incoterm ? `Selected Incoterm: ${ctx.incoterm}` : ''}

Return JSON only:
{
  "recommendedTerm": "<Incoterm code>",
  "confidence": "<high or medium or low>",
  "reasoning": "<2-3 sentences>",
  "sellerResponsibilities": ["<3 items>"],
  "buyerResponsibilities": ["<3 items>"],
  "riskLevel": "<low or medium or high>",
  "commonMistakes": ["<2-3 common mistakes>"]
}

Start with { and end with }. No prose.`;

  try {
    const raw = await callClaudeHaiku(prompt);
    return extractJSON<IncotermIntelligenceResult>(raw);
  } catch {
    return quickSuggestion(ctx); // fallback to SLM
  }
}

// ── Stage 3: Deal-specific execution insights (Claude Haiku) ──────────────────

async function executionInsights(ctx: IncotermContext): Promise<IncotermIntelligenceResult> {
  const knowledgeCtx = ctx.incoterm ? buildIncotermContext(ctx.incoterm) : '';

  const prompt = `You are an Incoterms 2020 expert advising a Canadian SME on a specific deal.
${knowledgeCtx ? `\nReference knowledge: ${knowledgeCtx}\n` : ''}
Product: ${ctx.product ?? 'Not specified'}
Destination: ${ctx.destination ?? 'Not specified'}
Deal value: ${ctx.price ? `$${ctx.price.toLocaleString()}` : 'Not specified'}
Selected Incoterm: ${ctx.incoterm ?? 'Not yet selected'}

Return JSON only:
{
  "recommendedTerm": "<Incoterm code>",
  "confidence": "<high or medium or low>",
  "reasoning": "<2-3 sentences specific to this deal>",
  "sellerResponsibilities": ["<4-5 specific items>"],
  "buyerResponsibilities": ["<4-5 specific items>"],
  "riskLevel": "<low or medium or high>",
  "marginImpact": "<1 sentence on cost impact>",
  "commonMistakes": ["<2-3 deal-specific mistakes to avoid>"]
}

Start with { and end with }. No prose.`;

  try {
    const raw = await callClaudeHaiku(prompt);
    return extractJSON<IncotermIntelligenceResult>(raw);
  } catch {
    return guidedAnalysis(ctx); // fallback to guided
  }
}

// ── Main orchestrator ─────────────────────────────────────────────────────────

export async function getIncotermIntelligence({
  context,
  stage,
}: {
  context: IncotermContext;
  stage: IncotermStage;
}): Promise<IncotermIntelligenceResult> {
  switch (stage) {
    case 'early':     return quickSuggestion(context);
    case 'exploring': return guidedAnalysis(context);
    case 'execution': return executionInsights(context);
    default:          return quickSuggestion(context);
  }
}
