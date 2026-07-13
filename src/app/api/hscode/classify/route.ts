import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import hsNomenclature from '@/data/hs-nomenclature.json';
import { env } from '@/lib/env';

interface HsNomenclatureEntry {
  id: string;
  desc: string;
  aggrlevel: number;
}

export interface HsClassificationResponse {
  hsCode: string;
  confidence: number;
  reasoning: string;
}

function hashText(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'not', 'other', 'than', 'whether',
  'our', 'are', 'was', 'were', 'has', 'have', 'its', 'their', 'this', 'that',
  'made', 'used', 'use', 'per', 'into', 'such', 'each', 'all', 'any',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
    .map((t) => (t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t));
}

function mockClassification(productDescription: string): HsClassificationResponse {
  const entries = hsNomenclature as HsNomenclatureEntry[];
  const tokens = tokenize(productDescription);

  // Weight tokens by rarity across the nomenclature so distinctive words
  // ("lobster") dominate generic ones ("frozen") that appear everywhere.
  const lowerDescs = entries.map((e) => e.desc.toLowerCase());
  const tokenWeight = new Map<string, number>();
  for (const token of tokens) {
    if (tokenWeight.has(token)) continue;
    let docFreq = 0;
    for (const desc of lowerDescs) {
      if (desc.includes(token)) docFreq += 1;
    }
    tokenWeight.set(token, docFreq === 0 ? 0 : token.length / docFreq);
  }

  let best: HsNomenclatureEntry | null = null;
  let bestScore = 0;
  let bestMatched = 0;

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    const desc = lowerDescs[i];
    let score = 0;
    let matched = 0;
    for (let t = 0; t < tokens.length; t += 1) {
      const token = tokens[t];
      if (desc.includes(token)) {
        // The last word is usually the head noun ("frozen atlantic LOBSTER"),
        // so it counts double to beat rare-but-secondary adjectives.
        const headBoost = t === tokens.length - 1 ? 2 : 1;
        score += (tokenWeight.get(token) ?? 0) * headBoost;
        matched += 1;
      }
    }
    if (score === 0) continue;
    // Prefer specific 6-digit codes over 4-digit headings on near-equal score.
    if (entry.aggrlevel === 6) score *= 1.05;
    if (score > bestScore) {
      bestScore = score;
      bestMatched = matched;
      best = entry;
    }
  }

  if (!best || tokens.length === 0) {
    const pick = entries[hashText(productDescription) % entries.length];
    return {
      hsCode: pick.id,
      confidence: 0.3,
      reasoning: `No keyword overlap found for "${productDescription.slice(0, 80)}". Nearest guess is ${pick.desc} (HS ${pick.id}) — search the nomenclature manually or refine the description.`,
    };
  }

  const coverage = bestMatched / tokens.length;
  const confidence = Math.min(0.85, Math.max(0.55, 0.5 + coverage * 0.35));

  return {
    hsCode: best.id,
    confidence,
    reasoning: `Keyword match mapped "${productDescription.slice(0, 80)}" to ${best.desc} (HS ${best.id}). Verify with CBSA tariff finder before filing.`,
  };
}

async function geminiClassification(
  productDescription: string
): Promise<HsClassificationResponse> {
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are a Canadian export customs classification assistant.
Given this product description, return ONLY valid JSON with keys:
- hsCode: 6-digit HS code without dots
- confidence: number 0-1
- reasoning: one sentence explaining the classification

Product: ${productDescription}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Gemini returned non-JSON response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as HsClassificationResponse;
  return {
    hsCode: String(parsed.hsCode).replace(/\D/g, '').slice(0, 6),
    confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.75)),
    reasoning: parsed.reasoning || 'Classified via Gemini.',
  };
}

export async function POST(request: NextRequest) {
  let body: { productDescription?: string };
  try {
    body = (await request.json()) as { productDescription?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const productDescription = body.productDescription?.trim();
  if (!productDescription) {
    return NextResponse.json({ error: 'productDescription is required' }, { status: 400 });
  }

  try {
    const classification =
      env.GEMINI_API_KEY.length > 0
        ? await geminiClassification(productDescription)
        : mockClassification(productDescription);

    return NextResponse.json(classification satisfies HsClassificationResponse);
  } catch (error) {
    const fallback = mockClassification(productDescription);
    return NextResponse.json({
      ...fallback,
      reasoning: `${fallback.reasoning} (Live model unavailable: ${
        error instanceof Error ? error.message : 'unknown error'
      })`,
    } satisfies HsClassificationResponse);
  }
}
