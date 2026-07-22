import Anthropic from '@anthropic-ai/sdk';
import { config } from '@/lib/config';

// ─── Local SLM (Ollama) ───────────────────────────────────────────────────────

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'mistral:7b-instruct-q4_K_M';

export async function callLocalSLM(prompt: string): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`[mercorama] Ollama error — status: ${res.status} body: ${body}`);
    throw new Error(`Ollama API error: ${res.status}`);
  }
  const data = await res.json() as { response: string };
  return data.response.trim();
}

// ─── SLM router — decides which backend to call ───────────────────────────────
// Route to LOCAL SLM: definitions, short queries, standard templates
// Route to Claude Haiku: multi-dimension analysis, risk scoring, final classifications

export async function routeQuery(userMessage: string): Promise<string> {
  const msg = userMessage.toLowerCase().trim();
  const isDefinition = /^(what is|explain|define|difference between|how does)/.test(msg);
  const isShort = userMessage.length < 200;
  const isComplex = /country|payment|risk|duty|tariff|fta|misclassif|red.?flag/i.test(msg);

  if ((isDefinition || isShort) && !isComplex) {
    try {
      return await callLocalSLM(userMessage);
    } catch (err) {
      console.warn('[mercorama] SLM unavailable, falling back to Haiku:', err);
      return callClaudeHaiku(userMessage);
    }
  }
  return callClaudeHaiku(userMessage);
}

const HAIKU_MODEL   = 'claude-haiku-4-5-20251001';
const SONNET_MODEL  = 'claude-sonnet-4-20250514';
const DEFAULT_MAX_TOKENS = 1024;

function getClient(): Anthropic {
  return new Anthropic({ apiKey: config.anthropicApiKey });
}

// ─── Canonical single-argument interface (required by CLAUDE.md) ──────────────

export async function callClaudeHaiku(prompt: string): Promise<string> {
  const client = getClient();

  try {
    const response = await client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: DEFAULT_MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error(`Unexpected content type from Anthropic: ${content.type}`);
    }
    return content.text;
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error(
        `[mercorama] Anthropic API error — status: ${error.status} body:`,
        JSON.stringify(error.error ?? error.message)
      );
    } else {
      console.error('[mercorama] Unexpected error calling Anthropic:', error);
    }
    throw error;
  }
}

// ─── Sonnet — Country Intelligence Layer 2/3 + multi-step trade strategy ─────
// Use ONLY for tasks listed in CLAUDE.md model strategy (Sonnet section).

export async function callClaudeSonnet(
  system: string,
  user:   string,
  maxTokens = 2048,
): Promise<string> {
  const client = getClient();
  try {
    const response = await client.messages.create({
      model:      SONNET_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    });
    const content = response.content[0];
    if (content.type !== 'text') throw new Error(`Unexpected content type: ${content.type}`);
    return content.text;
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error(
        `[mercorama] Anthropic Sonnet error — status: ${error.status} body:`,
        JSON.stringify(error.error ?? error.message)
      );
    } else {
      console.error('[mercorama] Unexpected error calling Sonnet:', error);
    }
    throw error;
  }
}

// ─── Legacy interface — kept so app/api/analyze/route.ts needs no changes ────

export interface ClaudeRequest {
  system: string;
  user: string;
  maxTokens?: number;
}

export async function callClaude(request: ClaudeRequest): Promise<string> {
  const client = getClient();

  try {
    const response = await client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
      system: request.system,
      messages: [{ role: 'user', content: request.user }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error(`Unexpected content type from Anthropic: ${content.type}`);
    }
    return content.text;
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error(
        `[mercorama] Anthropic API error — status: ${error.status} body:`,
        JSON.stringify(error.error ?? error.message)
      );
    } else {
      console.error('[mercorama] Unexpected error calling Anthropic:', error);
    }
    throw error;
  }
}

export async function callClaudeWithRetry(
  request: ClaudeRequest,
  maxRetries: number = 2
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await callClaude(request);
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        console.log(`[mercorama] Retrying Anthropic call (attempt ${attempt + 2}/${maxRetries + 1})...`);
      }
    }
  }

  throw lastError ?? new Error('Failed to call Anthropic API after retries');
}

export function parseClaudeJSON<T>(response: string): T {
  try {
    const jsonMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    const jsonString = jsonMatch ? jsonMatch[1] : response;
    return JSON.parse(jsonString.trim());
  } catch {
    console.error('[mercorama] Failed to parse Anthropic response as JSON:', response);
    throw new Error('Invalid JSON response from Anthropic API');
  }
}

export function extractJSON<T = unknown>(raw: string): T {
  // 1. Try extracting from a ```json ... ``` fence anywhere in the response
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim()) as T;
    } catch {
      // fall through to next strategy
    }
  }

  // 2. Try parsing the whole response directly
  try {
    return JSON.parse(raw.trim()) as T;
  } catch {
    // fall through
  }

  // 3. Find first { or [ and last matching } or ] and parse that slice
  const firstBrace = raw.search(/[{[]/);
  if (firstBrace === -1) throw new Error('No JSON found in response');
  const openChar = raw[firstBrace];
  const closeChar = openChar === '{' ? '}' : ']';
  const lastClose = raw.lastIndexOf(closeChar);
  if (lastClose === -1) throw new Error('Unclosed JSON in response');
  return JSON.parse(raw.slice(firstBrace, lastClose + 1)) as T;
}
