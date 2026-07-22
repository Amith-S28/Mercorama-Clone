// app/api/generate-deal-playbook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { runIntelligenceLayer } from '@/lib/intelligence/orchestrator';
import { lookupTariffRate } from '@/lib/tariff-rates';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a senior export trade advisor for Canadian SMEs. You generate specific, actionable export execution plans — not generic advice.

Respond with this exact JSON structure and nothing else:
{
  "productSummary": "<one sentence deal readiness verdict starting with: This deal is...>",
  "nextActions": [
    {
      "text": "<specific action the exporter must take, naming the exact document, agency, website, or step>",
      "priority": "<high or medium or low>",
      "category": "<compliance or documentation or logistics or finance>"
    }
  ],
  "compliance": ["<specific requirement naming the regulation, agency, or standard>"],
  "documentation": ["<specific document name and who issues it>"],
  "risks": ["<specific risk with consequence if not addressed>"]
}

Rules:
- Output JSON only. No prose, no markdown, no code fences.
- Start with { and end with }.
- All string values must use double quotes.
- Never use null — use empty string or empty array.
- nextActions: 8 to 12 items. Each must be a CONCRETE action (not "review compliance" but "Apply for CFIA export certification for seafood products via inspection.gc.ca").
- compliance: 4 to 8 items. Name the specific regulation or body (e.g. "CFIA Health Certificate required for food exports to EU under CETA Annex 5-F").
- documentation: 6 to 10 items. Name each document (e.g. "Commercial Invoice (3 copies, signed)" not just "invoice").
- risks: 3 to 6 items. State the specific consequence (e.g. "Without EUR.1 certificate, CETA preferential tariff of 0% is voided and MFN rate of 12% applies").
- priority: exactly high, medium, or low.
- category: exactly compliance, documentation, logistics, or finance.
- productSummary must begin with "This deal is" and include how many critical steps remain.
- Every item must reference the SPECIFIC product, country, HS code, or Incoterm from the user message — never generic.
- If the destination country has an active FTA with Canada, reference it by name and explain what it means for this deal.
- TARIFF RATES: Never estimate or fabricate tariff rates. If a verified rate is provided in the user message, use it exactly. If no rate is provided, write "verify with customs broker" instead of inventing a number.`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    productDescription, hsCode, hsDescription, hsRiskLevel,
    incoterm, incotermPlace, buyerCountry, buyerName, sellerName,
    currency, unitPrice, quantity, paymentMethod, paymentTerms,
    freightResponsibility, insuranceResponsibility, dealIntent,
  } = body;

  if (!productDescription || !hsCode || !incoterm) {
    return NextResponse.json({ error: 'productDescription, hsCode, and incoterm required' }, { status: 400 });
  }

  const dealValue = (unitPrice ?? 0) * (quantity ?? 1);

  // Look up verified tariff rate to inject into prompt — prevents AI hallucination
  let verifiedTariffLine = '';
  if (hsCode && buyerCountry) {
    const verified = lookupTariffRate(buyerCountry, hsCode);
    if (verified) {
      const rate = verified.preferential
        ? `MFN ${verified.mfn} / Preferential ${verified.preferential} (${verified.agreementName ?? 'FTA'})`
        : `MFN ${verified.mfn}`;
      verifiedTariffLine = `- Verified Tariff Rate: ${rate} [Source: ${verified.source}]`;
    }
  }

  const userPrompt = `Generate an Export Execution Playbook for this deal:

- Product: ${productDescription}
- HS Code: ${hsCode} (${hsDescription ?? ''})
- HS Risk Level: ${hsRiskLevel ?? 'Medium'}
- Seller: ${sellerName ?? 'Canadian Exporter'}
- Buyer: ${buyerName ?? 'International Buyer'} (${buyerCountry ?? 'Unknown'})
- Incoterm: ${incoterm} — ${incotermPlace ?? 'TBD'}
- Deal Value: ${currency ?? 'CAD'} ${dealValue.toLocaleString()}
- Payment: ${paymentMethod ?? 'TBD'} / ${paymentTerms ?? 'TBD'}
- Freight: ${freightResponsibility ?? 'Seller'}
- Insurance: ${insuranceResponsibility ?? 'Seller'}
${verifiedTariffLine ? verifiedTariffLine + '\n' : ''}\
${dealIntent ? `- Deal Objective: ${dealIntent === 'new_market' ? 'Entering a new market (first shipment)' : dealIntent === 'fulfil_order' ? 'Fulfilling a confirmed order' : dealIntent === 'repeat_deal' ? 'Repeating a previous deal' : 'Exploring options'}` : ''}`;

  try {
    const result = await runIntelligenceLayer({
      layer: 'compliance',
      stage: 'execution',
      context: {
        product: productDescription,
        hsCode,
        incoterm,
        country: buyerCountry,
        price: dealValue,
      },
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
    });
    return NextResponse.json(result.data);
  } catch (err) {
    console.error('[mercorama] generate-deal-playbook failed:', err);
    return NextResponse.json({
      productSummary: productDescription,
      nextActions: [], compliance: [], documentation: [], risks: [],
    });
  }
}
