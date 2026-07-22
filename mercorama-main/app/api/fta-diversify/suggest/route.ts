// app/api/fta-diversify/suggest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callClaudeWithRetry } from '@/lib/claude';
import { getKnowledgeContext } from '@/lib/intelligence/retrieval';
import type { FtaMarketSummary, EnhancedFtaMarketSummary } from '@/lib/fta-diversify';
import { lookupTariffRate } from '@/lib/tariff-rates';

// ─── Prompts ─────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a Canadian export market intelligence analyst.

Canada's active Free Trade Agreements (FTAs):
- CETA: EU member states (Germany, France, Netherlands, Spain, Italy, Poland, Sweden, Belgium, Austria, Denmark, Finland, Portugal, Czechia, Romania, Hungary, Greece, Slovakia, Bulgaria, Croatia, Slovenia, Lithuania, Latvia, Estonia, Cyprus, Luxembourg, Malta, Ireland)
- CPTPP: Australia, Brunei, Chile, Japan, Malaysia, Mexico, New Zealand, Peru, Singapore, Vietnam
- CUSMA: United States, Mexico
- CKFTA: South Korea
- EFTA: Iceland, Liechtenstein, Norway, Switzerland
- CCOFTA: Colombia
- CCRFTA: Costa Rica
- CPAFTA: Panama
- CHFTA: Honduras
- CIFTA: Israel
- CPEFTA: Peru

Task: Identify exactly 3 high-potential export markets for a Canadian SME using the FTAs above.

Rules:
1. Exclude markets in "currentMarkets".
2. Every market must belong to one of Canada's FTAs listed above.
3. Be specific and actionable.
4. Output JSON only. No prose, no markdown, no code fences.
5. Start your response with [ and end with ].

Each object in the array MUST have ALL of these keys:
{
  "regionCode": "<e.g. EU, CPTPP>",
  "country": "<country name>",
  "ftaName": "<e.g. CETA>",
  "rationale": "<two sentences why this market>",
  "tariffNote": "<tariff advantage under this FTA>",
  "marketSnapshot": {
    "marketSizeNote": "<market size>",
    "keySegments": ["<segment 1>", "<segment 2>"],
    "demographicsNote": "<buyer demographics>",
    "spendingNote": "<import trend>",
    "outlookNote": "<growth outlook>"
  },
  "riskFlags": ["<risk 1>", "<risk 2>"],
  "tariffInsight": {
    "baseTariffEstimate": "<MFN rate without FTA>",
    "ftaTariffEstimate": "<preferential rate under FTA>",
    "savingsInsight": "<one sentence on tariff savings>",
    "advantageLevel": "<high or medium or low>"
  },
  "eligibility": {
    "rulesOfOriginNote": "<one sentence on rules of origin>",
    "documentationRequired": ["<doc 1>", "<doc 2>"],
    "readinessLevel": "<easy or moderate or complex>"
  },
  "marketFit": {
    "bestFor": "<type of exporter this market suits>",
    "entryDifficulty": "<low or medium or high>",
    "timeToMarket": "<estimated time to first shipment>"
  },
  "decisionNote": "<one sentence recommendation, e.g. Best for premium exporters entering EU with long-term strategy>"
}

Return a JSON array of exactly 3 markets.`;

function buildPrompt(body: {
  company: { name: string | null; province: string | null; sector: string | null; currentMarkets: string[] };
  product: { description: string; hsCode: string | null };
  objective: string | null;
}): string {
  const { company, product, objective } = body;
  const alreadyIn = company.currentMarkets.length > 0 ? company.currentMarkets.join(', ') : 'None specified';

  return `CANADIAN SME PROFILE
Province: ${company.province ?? 'Not specified'}
Sector: ${company.sector ?? 'Not specified'}
Current export markets: ${alreadyIn}

PRODUCT
Description: ${product.description}
HS Code: ${product.hsCode ?? 'Not provided'}

OBJECTIVE
${objective ?? 'Identify the top FTA export opportunities for this product.'}

Return a JSON array of exactly 3 FTA-backed export markets for this SME. Exclude: ${alreadyIn}.`;
}

// ─── JSON extractor ───────────────────────────────────────────────────────────
// Walks the raw model output character-by-character to find the outermost
// JSON array or object, regardless of surrounding prose or fence markers.

function extractJson(text: string): string {
  // 1. Try to strip markdown fences first
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  // 2. Find the first { or [ whichever comes first
  const objIdx = text.indexOf('{');
  const arrIdx = text.indexOf('[');

  let start: number;
  let openChar: string;
  let closeChar: string;

  if (objIdx === -1 && arrIdx === -1) return text;
  if (objIdx === -1)         { start = arrIdx; openChar = '['; closeChar = ']'; }
  else if (arrIdx === -1)    { start = objIdx; openChar = '{'; closeChar = '}'; }
  else if (arrIdx < objIdx)  { start = arrIdx; openChar = '['; closeChar = ']'; }
  else                       { start = objIdx; openChar = '{'; closeChar = '}'; }

  // 3. Walk to find the matching closing bracket
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escaped)           { escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; continue; }
    if (ch === '"')        { inString = !inString; continue; }
    if (inString)          continue;
    if (ch === openChar)   depth++;
    else if (ch === closeChar) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }

  // 4. Closing bracket not found — return from start to end (best-effort)
  return text.slice(start);
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: {
    company: { name: string | null; province: string | null; sector: string | null; currentMarkets: string[] };
    product: { description: string; hsCode: string | null };
    objective: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.product?.description?.trim()) {
    return NextResponse.json({ error: 'product.description is required' }, { status: 400 });
  }

  // Inject market knowledge via retrieval layer
  let knowledgeBlock = '';
  try {
    knowledgeBlock = await getKnowledgeContext('market', 'exploring', {
      product: body.product.description,
      category: body.product.description,
      country: body.company.province ?? undefined,
    });
  } catch {}

  const enrichedSystem = knowledgeBlock
    ? `${SYSTEM_PROMPT}\n\nRelevant knowledge:\n${knowledgeBlock}`
    : SYSTEM_PROMPT;

  let raw: string;
  try {
    raw = await callClaudeWithRetry(
      { system: enrichedSystem, user: buildPrompt(body), maxTokens: 4096 },
      2,
    );
  } catch (error) {
    console.error('[mercorama] FTA suggest — AI call failed:', error);
    return NextResponse.json({ error: 'Market analysis failed. Please try again.' }, { status: 500 });
  }

  // Parse JSON robustly
  let markets: FtaMarketSummary[];
  try {
    const jsonStr = extractJson(raw);
    const value: unknown = JSON.parse(jsonStr);

    if (Array.isArray(value)) {
      markets = value as FtaMarketSummary[];
    } else if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      if (Array.isArray(obj.markets)) markets = obj.markets as FtaMarketSummary[];
      else if (Array.isArray(obj.suggested_markets)) markets = obj.suggested_markets as FtaMarketSummary[];
      else throw new Error('No markets array in response object');
    } else {
      throw new Error('Response is neither array nor object');
    }
  } catch (parseErr) {
    console.error('[mercorama] FTA suggest — parse error:', parseErr, '\nRaw output (first 800 chars):', raw.slice(0, 800));
    return NextResponse.json({ error: 'Could not parse market analysis. Please try again.' }, { status: 422 });
  }

  if (markets.length === 0) {
    return NextResponse.json({ error: 'No markets returned. Please refine your product description.' }, { status: 422 });
  }

  // Normalise — fill in missing optional fields so the UI never crashes
  // Then override AI-generated tariff figures with verified lookup data
  const hsCode = body.product?.hsCode ?? null;

  const normalised = (markets as unknown as Record<string, unknown>[]).map((m): EnhancedFtaMarketSummary => ({
    regionCode:   (m.regionCode as string)   ?? '',
    country:      (m.country as string)      ?? 'Unknown',
    ftaName:      (m.ftaName as string)      ?? '',
    rationale:    (m.rationale as string)    ?? '',
    tariffNote:   (m.tariffNote as string)   ?? '',
    marketSnapshot: {
      marketSizeNote:   (m.marketSnapshot as Record<string, unknown>)?.marketSizeNote as string ?? '',
      keySegments:      Array.isArray((m.marketSnapshot as Record<string, unknown>)?.keySegments) ? (m.marketSnapshot as Record<string, unknown>).keySegments as string[] : [],
      demographicsNote: (m.marketSnapshot as Record<string, unknown>)?.demographicsNote as string ?? '',
      spendingNote:     (m.marketSnapshot as Record<string, unknown>)?.spendingNote as string ?? '',
      outlookNote:      (m.marketSnapshot as Record<string, unknown>)?.outlookNote as string ?? '',
    },
    riskFlags: Array.isArray(m.riskFlags) ? m.riskFlags as string[] : [],
    tariffInsight: (() => {
      const ai = m.tariffInsight as Record<string, unknown> | undefined;
      if (!hsCode || !m.country) return ai;
      const verified = lookupTariffRate(m.country as string, hsCode);
      if (!verified) return ai;
      return {
        ...(ai ?? {}),
        baseTariffEstimate: verified.mfn,
        ftaTariffEstimate: verified.preferential ?? ai?.ftaTariffEstimate,
        tariffSource: verified.source,
        tariffVerified: verified.verified,
      };
    })(),
    eligibility: m.eligibility ?? undefined,
    marketFit: m.marketFit ?? undefined,
    decisionNote: (m.decisionNote as string) ?? undefined,
  }));

  return NextResponse.json({ markets: normalised });
}
