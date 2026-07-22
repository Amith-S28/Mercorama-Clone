// lib/hs/intelligence.ts
// Unified HS Code Intelligence — single orchestrator for all classification logic.
// Routes to SLM (Ollama) for quick heading suggestions, Claude for classification.

import { callLocalSLM, callClaudeHaiku, extractJSON } from '@/lib/claude';
import { findRelevantHSKnowledge } from './knowledge';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HSCodeIntelligenceResult {
  primaryCode: string;
  confidence: 'high' | 'medium' | 'low';
  alternatives: string[];
  description: string;
  reasoning: string;
  dutyRange?: string;
  ftaEligible?: boolean;
  complianceNotes?: string[];
}

export type HSStage = 'early' | 'exploring' | 'execution';

// ── Stage 1: Quick SLM heading suggestion (Ollama) ────────────────────────────

async function quickSuggestion(productDescription: string): Promise<HSCodeIntelligenceResult> {
  const prompt = `You are a customs classification assistant. Suggest the most likely 2-3 HS code headings (4-digit) for this product. Be specific and brief.

Product: ${productDescription}

Format: list each heading with a one-line reason.`;

  try {
    const raw = await callLocalSLM(prompt);
    // Extract first HS code mentioned
    const codeMatch = raw.match(/\b(\d{4})\b/);
    return {
      primaryCode: codeMatch?.[0] ?? '',
      confidence: 'low',
      alternatives: [],
      description: raw.slice(0, 200),
      reasoning: 'Pre-classification suggestion — verify with full classification.',
    };
  } catch {
    return {
      primaryCode: '',
      confidence: 'low',
      alternatives: [],
      description: productDescription,
      reasoning: 'Classification pending — full analysis required.',
    };
  }
}

// ── Stage 2: Structured classification (Claude Haiku) ─────────────────────────

async function structuredClassification(productDescription: string, destinationCountry?: string): Promise<HSCodeIntelligenceResult> {
  const knowledge = findRelevantHSKnowledge(productDescription);

  const prompt = `You are a WCO HS 2022 customs classification expert.
${knowledge ? `\nRelevant classification knowledge:\n${knowledge}\n` : ''}
Product: ${productDescription}
${destinationCountry ? `Destination: ${destinationCountry}` : ''}

Return JSON only:
{
  "primaryCode": "<6-digit HS 2022 code>",
  "confidence": "<high or medium or low>",
  "alternatives": ["<alternative HS code if applicable>"],
  "description": "<official HS heading description>",
  "reasoning": "<2-3 sentences explaining classification logic using GRI rules>",
  "complianceNotes": ["<relevant compliance consideration>"]
}

Start with { and end with }. No prose.`;

  try {
    const raw = await callClaudeHaiku(prompt);
    return extractJSON<HSCodeIntelligenceResult>(raw);
  } catch {
    return quickSuggestion(productDescription);
  }
}

// ── Stage 3: Enhanced intelligence (Claude Haiku + tariff) ────────────────────

async function enhancedIntelligence(productDescription: string, destinationCountry?: string): Promise<HSCodeIntelligenceResult> {
  const knowledge = findRelevantHSKnowledge(productDescription);

  const prompt = `You are a senior customs classification and trade compliance expert.
${knowledge ? `\nRelevant classification knowledge:\n${knowledge}\n` : ''}
Product: ${productDescription}
${destinationCountry ? `Destination: ${destinationCountry}` : ''}

Return JSON only:
{
  "primaryCode": "<6-digit HS 2022 code>",
  "confidence": "<high or medium or low>",
  "alternatives": ["<alternative codes>"],
  "description": "<official HS heading description>",
  "reasoning": "<3-4 sentences with GRI analysis>",
  "dutyRange": "<estimated MFN duty range for destination, or empty string>",
  "ftaEligible": true or false,
  "complianceNotes": ["<specific compliance requirements for this product + destination>"]
}

Start with { and end with }. No prose.`;

  try {
    const raw = await callClaudeHaiku(prompt);
    return extractJSON<HSCodeIntelligenceResult>(raw);
  } catch {
    return structuredClassification(productDescription, destinationCountry);
  }
}

// ── Main orchestrator ─────────────────────────────────────────────────────────

export async function getHSCodeIntelligence({
  productDescription,
  destinationCountry,
  stage,
}: {
  productDescription: string;
  destinationCountry?: string;
  stage: HSStage;
}): Promise<HSCodeIntelligenceResult> {
  switch (stage) {
    case 'early':     return quickSuggestion(productDescription);
    case 'exploring': return structuredClassification(productDescription, destinationCountry);
    case 'execution': return enhancedIntelligence(productDescription, destinationCountry);
    default:          return quickSuggestion(productDescription);
  }
}
