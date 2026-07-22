import { NextRequest, NextResponse } from 'next/server';
import { callClaudeWithRetry, parseClaudeJSON } from '@/lib/claude';
import fs from 'fs';
import path from 'path';

// Look up official WCO description from local HS 2022 reference file
function lookupWcoDescription(hsCode: string): string | undefined {
  try {
    const refPath = path.join(process.cwd(), 'data', 'hs6-reference.json');
    if (!fs.existsSync(refPath)) return undefined;
    const raw = fs.readFileSync(refPath, 'utf8');
    const ref = JSON.parse(raw) as { results: { id: string; text: string }[] };
    // Normalise: strip dots and spaces, take first 6 digits
    const code6 = hsCode.replace(/\W/g, '').slice(0, 6);
    const entry = ref.results?.find((d) => d.id === code6);
    return entry?.text;
  } catch {
    return undefined;
  }
}
import {
  buildIncotermPrompt,
  buildHSCodePrompt,
  buildContractPrompt,
  buildDocCheckerPrompt,
  buildClassificationPrompt,
} from '@/lib/prompts';
import {
  IncotermAnalysisRequest,
  IncotermAnalysisResponse,
  HSCodeAnalysisRequest,
  HSCodeAnalysisResponse,
  ContractGeneratorRequest,
  ContractGeneratorResponse,
  DocCheckerRequest,
  DocCheckerResponse,
  ClassificationRequest,
  ClassificationResponse,
} from '@/lib/types';
import { checkUsageGate, incrementUsage, getUserWithPlan, getResetDate } from '@/lib/gate';
import { getUSITCRate, getEffectiveRate } from '@/lib/usitc';

function trimForFreeTier(fullResult: any, type: string) {
  if (type === 'incoterm') {
    // Keep basic structure but limit some detail, while preserving mistakes/alternatives
    return {
      explanation: fullResult.explanation || 'Upgrade for detailed explanation',
      responsibilities: {
        seller: (fullResult.responsibilities?.seller || []).slice(0, 3),
        buyer: (fullResult.responsibilities?.buyer || []).slice(0, 3),
      },
      riskTransferPoint: fullResult.riskTransferPoint || 'Upgrade to see details',
      // Keep these so the UI always has content
      commonMistakes: fullResult.commonMistakes || [],
      alternatives: fullResult.alternatives || [],
      _trimmed: true,
      _upgradeMessage:
        'Upgrade to Pro for full responsibility detail and more Incoterm options.',
    };
  }
  if (type === 'hscode') {
    // Keep basic structure but limit detail
    return {
      hsCode: fullResult.hsCode || '000000',
      confidence: fullResult.confidence || 'medium',
      classification: {
        chapter: fullResult.classification?.chapter || 'Upgrade to see details',
        heading: fullResult.classification?.heading || 'Upgrade to see details',
        subheading: fullResult.classification?.subheading || 'Upgrade to see details',
      },
      reasoning: 'Basic classification provided. Upgrade to Pro for detailed reasoning.',
      misclassificationRisks: ['Upgrade to Pro to see misclassification risks'],
      dutyRates: [],
      tradeAgreements: [],
      _trimmed: true,
      _upgradeMessage:
        'Upgrade to Pro for duty rates, trade agreements, and risk analysis',
    };
  }
  return fullResult;
}

// ─── Incoterm post-processor to guarantee populated lists ────────────────────

function ensureIncotermLists(result: IncotermAnalysisResponse): IncotermAnalysisResponse {
  const fallbackMistakes: string[] = [
    'Assuming the Incoterm governs all aspects of the contract instead of only delivery, allocation of costs, and transfer of risk.',
    'Failing to align the chosen Incoterm with the actual logistics setup and mode of transport used for the main carriage.',
    'Not specifying the named place or port precisely, leading to disputes over where costs and risks actually transfer.',
  ];

  const fallbackAlternatives: { incoterm: string; reasoning: string }[] = [
    {
      incoterm: 'FOB',
      reasoning:
        'Commonly used when the buyer is comfortable arranging main carriage and insurance, and wants control once the goods are loaded on board at the port of shipment.',
    },
    {
      incoterm: 'CIF',
      reasoning:
        'Often considered when the seller is willing to arrange and pay for carriage and minimum insurance up to the named port of destination, while risk still transfers at loading.',
    },
  ];

  return {
    ...result,
    commonMistakes:
      Array.isArray(result.commonMistakes) && result.commonMistakes.length > 0
        ? result.commonMistakes
        : fallbackMistakes,
    alternatives:
      Array.isArray(result.alternatives) && result.alternatives.length > 0
        ? result.alternatives
        : fallbackAlternatives,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, payload } = body;

    if (!type || !payload) {
      return NextResponse.json(
        { error: 'Missing required fields: type and payload' },
        { status: 400 },
      );
    }

    // Validate type
    if (
      !['incoterm', 'hscode', 'contract', 'doc_checker', 'classification'].includes(type)
    ) {
      return NextResponse.json(
        { error: 'Invalid analysis type' },
        { status: 400 },
      );
    }

    // Check API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          error:
            'ANTHROPIC_API_KEY is not configured. Please add it to your environment variables.',
        },
        { status: 500 },
      );
    }

    // Check usage gate BEFORE calling Claude
    const userId = 'default'; // In production, get from auth session
    const gateResult = await checkUsageGate(userId, type);

    if (!gateResult.allowed) {
      if (gateResult.reason === 'upgrade_required') {
        return NextResponse.json(
          {
            error: 'upgrade_required',
            feature: gateResult.feature,
            message: `${gateResult.feature} requires a paid plan`,
          },
          { status: 403 },
        );
      }
      if (gateResult.reason === 'quota_exceeded') {
        return NextResponse.json(
          {
            error: 'quota_exceeded',
            message: 'Monthly analysis limit reached',
            reset_date: getResetDate(),
          },
          { status: 403 },
        );
      }
    }

    let prompt: { system: string; user: string };
    let response: string;
    const user = getUserWithPlan(userId);

    // Route to appropriate analysis function
    switch (type) {
      case 'incoterm': {
        const incotermRequest = payload as IncotermAnalysisRequest;

        // Validate required fields
        if (
          !incotermRequest.incoterm ||
          !incotermRequest.originCountry ||
          !incotermRequest.destinationCountry
        ) {
          return NextResponse.json(
            { error: 'Missing required fields for Incoterm analysis' },
            { status: 400 },
          );
        }

        prompt = buildIncotermPrompt(incotermRequest);
        response = await callClaudeWithRetry(prompt);
        const rawResult = parseClaudeJSON<IncotermAnalysisResponse>(response);
        const result = ensureIncotermLists(rawResult);

        // Increment usage AFTER successful Claude response
        incrementUsage(userId, 'incoterm');

        return NextResponse.json({ result });
      }

      case 'hscode': {
        const hscodeRequest = payload as HSCodeAnalysisRequest;

        // Validate required fields
        if (!hscodeRequest.productDescription) {
          return NextResponse.json(
            { error: 'Missing required field: productDescription' },
            { status: 400 },
          );
        }

        prompt = buildHSCodePrompt(hscodeRequest);
        response = await callClaudeWithRetry(prompt);
        const result = parseClaudeJSON<HSCodeAnalysisResponse>(response);

        // Enrich with official WCO description from local HS 2022 reference
        const wcoDescription = lookupWcoDescription(result.hsCode);
        if (wcoDescription) result.wcoDescription = wcoDescription;

        // Enrich with verified tariff data (USITC for US; WTO link for other markets)
        const dest = (hscodeRequest.destinationCountry ?? '').toLowerCase();
        const isUS = dest.includes('united states') || dest === 'us' || dest === 'usa';
        if (isUS) {
          try {
            const usitc = await getUSITCRate(result.hsCode);
            if (usitc) {
              const { rateStr, fromFTA } = getEffectiveRate(usitc, 'CUSMA');
              result.dutyRates = [{
                country: 'United States',
                rate: fromFTA ? `${rateStr} (CUSMA)` : rateStr,
                notes: `Source: USITC HTS (verified ${usitc.lastVerifiedAt?.slice(0, 10) ?? 'N/A'})`,
              }];
            }
          } catch {
            // Non-fatal: fall back to no duty data
          }
        } else if (dest) {
          result.dutyRates = [{
            country: hscodeRequest.destinationCountry!,
            rate: 'Verify',
            notes: 'Tariff rates for this market must be verified at the WTO Tariff Download Facility or official customs authority.',
          }];
        }

        // Increment usage AFTER successful Claude response
        incrementUsage(userId, 'hscode');

        return NextResponse.json({ result });
      }

      case 'contract': {
        const contractRequest = payload as ContractGeneratorRequest;

        // Validate required fields
        if (
          !contractRequest.incoterm ||
          !contractRequest.paymentTerms ||
          !contractRequest.buyerCountry ||
          !contractRequest.sellerCountry
        ) {
          return NextResponse.json(
            {
              error:
                'Missing required fields for contract generation',
            },
            { status: 400 },
          );
        }

        prompt = buildContractPrompt(contractRequest);
        response = await callClaudeWithRetry(prompt, 3); // More retries for complex contracts
        const result = parseClaudeJSON<ContractGeneratorResponse>(response);

        // Increment usage AFTER successful Claude response
        incrementUsage(userId, 'contract');

        // Contract feature is locked for free tier, so no trimming needed (gate prevents access)
        return NextResponse.json({ result });
      }

      case 'doc_checker': {
        const req = payload as DocCheckerRequest;
        if (
          !req.exporterCountry ||
          !req.importerCountry ||
          !req.commercialInvoice ||
          !req.packingList
        ) {
          return NextResponse.json(
            {
              error:
                'Missing required fields: exporterCountry, importerCountry, commercialInvoice, packingList',
            },
            { status: 400 },
          );
        }
        prompt = buildDocCheckerPrompt(req);
        response = await callClaudeWithRetry(prompt, 3);
        const docResult = parseClaudeJSON<DocCheckerResponse>(response);
        incrementUsage(userId, 'doc_checker');
        return NextResponse.json({ result: docResult });
      }

      case 'classification': {
        const req = payload as ClassificationRequest;
        if (!req.shortName || !req.detailedDescription) {
          return NextResponse.json(
            {
              error:
                'Missing required fields: shortName, detailedDescription',
            },
            { status: 400 },
          );
        }
        prompt = buildClassificationPrompt(req);
        response = await callClaudeWithRetry(prompt, 3);
        const classResult = parseClaudeJSON<ClassificationResponse>(response);
        incrementUsage(userId, 'classification');
        return NextResponse.json({ result: classResult });
      }

      default:
        return NextResponse.json(
          { error: 'Unknown analysis type' },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('[v0] API error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        details: 'Failed to process analysis request',
      },
      { status: 500 },
    );
  }
}

