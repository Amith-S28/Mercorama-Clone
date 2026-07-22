// lib/intelligence/router.ts
// Model router — stage determines which model handles the request.

import { callClaudeHaiku, callClaudeSonnet, callLocalSLM, callClaudeWithRetry } from '@/lib/claude';
import type { IntelligenceStage } from './types';

export interface RouteResult {
  response: string;
  modelUsed: string;
}

export async function routeModel(
  stage: IntelligenceStage,
  prompt: string,
  systemPrompt?: string,
): Promise<RouteResult> {
  if (stage === 'early') {
    try {
      return { response: await callLocalSLM(prompt), modelUsed: 'ollama-slm' };
    } catch {
      return { response: await callClaudeHaiku(prompt), modelUsed: 'claude-haiku' };
    }
  }

  if (stage === 'exploring') {
    // Use system+user split when system prompt is provided (better JSON compliance)
    if (systemPrompt) {
      const response = await callClaudeWithRetry({ system: systemPrompt, user: prompt, maxTokens: 2048 });
      return { response, modelUsed: 'claude-haiku' };
    }
    return { response: await callClaudeHaiku(prompt), modelUsed: 'claude-haiku' };
  }

  // execution — Sonnet
  if (systemPrompt) {
    return { response: await callClaudeSonnet(systemPrompt, prompt), modelUsed: 'claude-sonnet' };
  }
  return { response: await callClaudeHaiku(prompt), modelUsed: 'claude-haiku' };
}
