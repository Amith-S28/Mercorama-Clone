// app/api/export-compass/analyze/route.ts
//
// POST /api/export-compass/analyze
//
// Accepts: { productDescription, hsCode, originCountry }
// Returns: { session: ExportCompassSession }
//
// AI data note: market intelligence is Claude-generated for now.
// analyzeWithModel() is the swap point for Ollama once the local SLM is live.
// Keep all prompt logic here — one place to change for both providers.

import { NextRequest, NextResponse } from 'next/server';
import { callClaudeWithRetry } from '@/lib/claude';
import {
  computeExportScore,
  type MarketIntelligenceCard,
  type MarketScores,
  type MarketDataSources,
} from '@/lib/export-compass';
import { getCAExportShare, STATCAN_COUNTRY_MAP } from '@/lib/statcan';
import { getComtradeMarketData, formatGrowth, formatMarketSize } from '@/lib/comtrade';
import { getUSITCRate, getEffectiveRate } from '@/lib/usitc';
import { lookupTariffRate } from '@/lib/tariff-rates';

// ─── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an international trade intelligence assistant inside Mercorama, a platform that helps Canadian SMEs identify export markets.

Your task is to produce structured, explainable market intelligence for a Canadian exporter.

Rules:
1. Identify the top 10 global import markets for the given product from Canada.
   Include a mix of established and high-growth/emerging markets.
2. For each market, produce realistic, internally consistent trade signals based on
   publicly known trade patterns. Do not invent company names or reference private contracts.
3. FTA availability: Canada's active FTAs cover — CETA (EU), CPTPP (Australia, Brunei, Chile,
   Japan, Malaysia, Mexico, New Zealand, Peru, Singapore, Vietnam), CUSMA (US, Mexico),
   CKFTA (South Korea), EFTA (Iceland, Liechtenstein, Norway, Switzerland),
   CCOFTA (Colombia), CCRFTA (Costa Rica), CPAFTA (Panama), CHFTA (Honduras),
   CIFTA (Israel), CPEFTA (Peru).
4. Scores are on a 0–100 scale. Be discriminating — spread scores across the range.
5. insight must be a single paragraph, under 120 words, explaining why this is a strong
   market specifically for a Canadian SME exporting this product.
6. Output ONLY valid JSON — a single object with keys "productLabel" (string) and
   "markets" (array). No prose outside the JSON object.`;

// ─── Prompt builder ────────────────────────────────────────────────────────────

function buildUserPrompt(
  productDescription: string,
  hsCode: string | null,
  originCountry: string
): string {
  return `EXPORT ANALYSIS REQUEST

Product: ${productDescription}
${hsCode ? `HS Code: ${hsCode}` : 'HS Code: not provided — infer from product description'}
Origin country: ${originCountry}

Return a JSON object with this exact shape:

{
  "productLabel": "<concise product name, 2–5 words>",
  "markets": [
    {
      "country": "string",
      "regionCode": "string",      // e.g. "EU", "APAC", "NA", "LATAM", "MEA"
      "ftaName": "string | null",  // e.g. "CETA", "CPTPP", null
      "ftaAvailable": true/false,
      "importValueUSD": "string",  // e.g. "$1.2B" or "$340M"
      "importGrowth5y": "string",  // e.g. "+8.2%" or "-1.4%"
      "canadaExportShare": "string", // e.g. "14%" (Canada's share of this market's imports)
      "tariffRate": "string",      // e.g. "0%" or "6.5%"
      "topCompetitors": ["string", "string"],  // 2–4 competing exporter countries
      "scores": {
        "demand": 0-100,
        "growth": 0-100,
        "canadaAdvantage": 0-100,
        "marketAccess": 0-100,
        "logistics": 0-100,
        "risk": 0-100
      },
      "insight": "string"
    }
    // ... 9 more markets
  ]
}

Generate exactly 10 markets. Sort by overall market attractiveness (not by name).`;
}

// ─── JSON extractor ────────────────────────────────────────────────────────────

function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) return fenceMatch[1].trim();

  const objIdx = text.indexOf('{');
  if (objIdx === -1) return text;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = objIdx; i < text.length; i++) {
    const ch = text[i];
    if (escaped)                     { escaped = false; continue; }
    if (ch === '\\' && inString)     { escaped = true; continue; }
    if (ch === '"')                  { inString = !inString; continue; }
    if (inString)                    continue;
    if (ch === '{')                  depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(objIdx, i + 1);
    }
  }
  return text.slice(objIdx);
}

// ─── analyzeWithModel — swap point for Ollama ─────────────────────────────────
// When Ollama is live: change provider check, point to local REST endpoint,
// keep systemPrompt + userPrompt unchanged.

async function analyzeWithModel(
  systemPrompt: string,
  userPrompt: string,
  _provider: 'claude' | 'ollama' = 'claude'
): Promise<string> {
  // TODO: when provider === 'ollama', call http://localhost:11434/api/generate
  return callClaudeWithRetry(
    { system: systemPrompt, user: userPrompt, maxTokens: 4096 },
    2
  );
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: {
    productDescription: string;
    hsCode?: string | null;
    originCountry?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const productDescription = body.productDescription?.trim();
  if (!productDescription) {
    return NextResponse.json(
      { error: 'productDescription is required' },
      { status: 400 }
    );
  }

  const hsCode = body.hsCode ?? null;
  const originCountry = body.originCountry ?? 'Canada';

  // ── Call AI ──────────────────────────────────────────────────────────────────
  let raw: string;
  try {
    raw = await analyzeWithModel(
      SYSTEM_PROMPT,
      buildUserPrompt(productDescription, hsCode, originCountry)
    );
  } catch (err) {
    console.error('[mercorama] Export Compass — AI call failed:', err);
    return NextResponse.json(
      { error: 'Market analysis failed. Please try again.' },
      { status: 500 }
    );
  }

  // ── Parse response ──────────────────────────────────────────────────────────
  let productLabel: string;
  let rawMarkets: MarketIntelligenceCard[];

  try {
    const jsonStr = extractJson(raw);
    const parsed = JSON.parse(jsonStr) as {
      productLabel: string;
      markets: Array<MarketIntelligenceCard & { scores: MarketScores }>;
    };

    if (!parsed.markets || !Array.isArray(parsed.markets)) {
      throw new Error('No markets array in response');
    }

    productLabel = parsed.productLabel ?? productDescription.slice(0, 40);

    // Normalise each card + compute exportScore
    rawMarkets = parsed.markets.map((m) => {
      const scores: MarketScores = {
        demand:          clamp(m.scores?.demand ?? 50),
        growth:          clamp(m.scores?.growth ?? 50),
        canadaAdvantage: clamp(m.scores?.canadaAdvantage ?? 50),
        marketAccess:    clamp(m.scores?.marketAccess ?? 50),
        logistics:       clamp(m.scores?.logistics ?? 50),
        risk:            clamp(m.scores?.risk ?? 50),
      };
      const ftaAvailable = Boolean(m.ftaAvailable);
      const dataSources: MarketDataSources = {
        tradeStats:      'Estimated',
        canadaShare:     'Estimated',
        tariffData:      'Estimated',
        ftaData:         ftaAvailable ? 'Manual' : 'Estimated',
        scores:          'Estimated',
        confidenceLevel: 'estimated',
        lastVerifiedAt:  null,
      };
      return {
        country:            m.country ?? 'Unknown',
        regionCode:         m.regionCode ?? '',
        ftaName:            m.ftaName ?? null,
        ftaAvailable,
        importValueUSD:     m.importValueUSD ?? 'N/A',
        importGrowth5y:     m.importGrowth5y ?? 'N/A',
        canadaExportShare:  m.canadaExportShare ?? 'N/A',
        tariffRate:         m.tariffRate ?? 'N/A',
        topCompetitors:     Array.isArray(m.topCompetitors) ? m.topCompetitors : [],
        scores,
        exportScore:        computeExportScore(scores),
        insight:            m.insight ?? '',
        dataSources,
      };
    });

    // Sort by exportScore descending
    rawMarkets.sort((a, b) => b.exportScore - a.exportScore);

  } catch (parseErr) {
    console.error(
      '[mercorama] Export Compass — parse error:',
      parseErr,
      '\nRaw output (first 800):', raw.slice(0, 800)
    );
    return NextResponse.json(
      { error: 'Could not parse market analysis. Please try again.' },
      { status: 422 }
    );
  }

  if (rawMarkets.length === 0) {
    return NextResponse.json(
      { error: 'No markets returned. Please refine your product description.' },
      { status: 422 }
    );
  }

  // ── Enrich with live data (EC-1.1 + EC-1.2 + TE-2.1) ───────────────────────
  // Run in parallel per market; fall back to Claude's Estimated values on error.
  if (hsCode) {
    const normalizedHs = hsCode.replace(/\./g, '').slice(0, 6);
    // Build reverse lookup: country name → ISO3 (used by Comtrade + StatCan)
    const nameToIso3 = Object.fromEntries(
      Object.entries(STATCAN_COUNTRY_MAP).map(([iso3, name]) => [name, iso3])
    );

    rawMarkets = await Promise.all(
      rawMarkets.map(async (market) => {
        const iso3 = nameToIso3[market.country] ?? null;

        const [comtradeResult, statcanResult, usitcResult] = await Promise.allSettled([
          iso3 ? getComtradeMarketData(normalizedHs, iso3, { supabaseOnly: true }) : Promise.resolve(null),
          getCAExportShare(normalizedHs, market.country),
          market.country === 'United States' ? getUSITCRate(normalizedHs) : Promise.resolve(null),
        ]);

        const comtrade = comtradeResult.status === 'fulfilled' ? comtradeResult.value : null;
        const statcan  = statcanResult.status  === 'fulfilled' ? statcanResult.value  : null;
        const usitc    = usitcResult.status    === 'fulfilled' ? usitcResult.value    : null;

        const ds: MarketDataSources = { ...market.dataSources };
        let importValueUSD    = market.importValueUSD;
        let importGrowth5y    = market.importGrowth5y;
        let canadaExportShare = market.canadaExportShare;
        let tariffRate        = market.tariffRate;

        // Comtrade → market size + growth
        if (comtrade?.importValueUSD) {
          importValueUSD = formatMarketSize(comtrade.importValueUSD);
          ds.tradeStats  = 'UN Comtrade';
          if (ds.confidenceLevel === 'estimated') ds.confidenceLevel = 'current';
          ds.lastVerifiedAt = comtrade.lastVerifiedAt ?? ds.lastVerifiedAt;
        }
        if (comtrade?.importGrowth5y != null) {
          importGrowth5y = formatGrowth(comtrade.importGrowth5y);
        }

        // StatCan → Canada's export share
        if (statcan?.sharePercent != null) {
          canadaExportShare = `${statcan.sharePercent.toFixed(1)}%`;
          ds.canadaShare    = 'Stats Canada';
          if (ds.confidenceLevel === 'estimated') ds.confidenceLevel = 'current';
          if (!ds.lastVerifiedAt) ds.lastVerifiedAt = statcan.lastVerifiedAt;
        }

        // USITC → tariff rate for US market (MFN or FTA rate)
        if (usitc) {
          const { rateStr } = getEffectiveRate(usitc, market.ftaName);
          tariffRate     = rateStr;
          ds.tariffData  = 'USITC HTS';
          if (ds.confidenceLevel === 'estimated') ds.confidenceLevel = 'verified';
          if (!ds.lastVerifiedAt) ds.lastVerifiedAt = usitc.lastVerifiedAt;
        }

        // Verified tariff lookup for all markets (overrides AI estimate; USITC already handled US above)
        if (hsCode && market.country !== 'United States') {
          const verified = lookupTariffRate(market.country, hsCode);
          if (verified) {
            // Use preferential rate when FTA applies, otherwise MFN
            tariffRate    = verified.preferential && market.ftaAvailable ? verified.preferential : verified.mfn;
            ds.tariffData = 'Manual'; // closest SourceTag for static reference data
            if (ds.confidenceLevel === 'estimated') {
              ds.confidenceLevel = verified.verified ? 'verified' : 'current';
            }
          }
        }

        return { ...market, importValueUSD, importGrowth5y, canadaExportShare, tariffRate, dataSources: ds };
      })
    );
  }

  // ── Build session payload (no localStorage on server — client creates it) ───
  const sessionPayload = {
    productDescription,
    hsCode,
    originCountry,
    productLabel,
    recommendedMarkets: rawMarkets,
    status: 'complete' as const,
  };

  return NextResponse.json({ session: sessionPayload });
}

function clamp(v: number): number {
  return Math.min(100, Math.max(0, Math.round(v)));
}
