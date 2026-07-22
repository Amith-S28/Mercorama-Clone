// app/api/deal/contract/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callClaudeWithRetry } from '@/lib/claude';

const SYSTEM_PROMPT = `You are a senior trade lawyer specialising in international sale of goods contracts for Canadian SME exporters.

Draft a complete, professional contract from the deal parameters provided.

MANDATORY REQUIREMENTS:
1. Reference the HS Code prominently in the goods description section (e.g. "classified under HS Code XXXX.XX.XX").
2. Name the exact Incoterm rule and named place in the Delivery clause.
3. Reflect freight and insurance responsibilities consistently with the chosen Incoterm.
4. Include all of: Preamble, Parties, Definitions, Goods & HS Code, Price & Payment, Delivery & Incoterm, Risk Transfer, Insurance, Documentation, Warranties, Force Majeure, Dispute Resolution, Governing Law (Ontario, Canada as default unless otherwise noted).
5. Keep language clear and precise — suitable for Canadian SME exporters dealing internationally.
6. Output ONLY the contract text. No JSON. No markdown fences. No commentary before or after. Plain numbered sections.`;

interface LineItem {
  sku?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  hsCode?: string;
}

function buildCommercialTerms(body: Record<string, unknown>): string {
  const items = Array.isArray(body.items) ? (body.items as LineItem[]) : [];
  const currency = String(body.currency ?? 'CAD');

  if (items.length > 0) {
    const rows = items.map((item) => {
      const total = item.unitPrice * item.quantity;
      const sku = item.sku ? `[${item.sku}] ` : '';
      return `  ${sku}${item.name}: ${item.quantity.toLocaleString()} × ${currency} ${item.unitPrice.toFixed(2)} = ${currency} ${total.toFixed(2)}`;
    });
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    return `COMMERCIAL TERMS — LINE ITEMS (Schedule A)
  All items share HS Code: ${body.hsCode}
  Currency: ${currency}

${rows.join('\n')}

  Subtotal: ${currency} ${subtotal.toFixed(2)}

Include these line items as Schedule A in the contract. Reference them by name/SKU in the Goods & HS Code and Price & Payment sections. Present them as a table in Schedule A with columns: SKU, Description, Quantity, Unit Price, Line Total.`;
  }

  // Fallback: single-product deal
  const totalValue = (Number(body.unitPrice) || 0) * (Number(body.quantity) || 1);
  return `COMMERCIAL TERMS
  Currency:    ${currency}
  Unit Price:  ${currency} ${Number(body.unitPrice || 0).toLocaleString()}
  Quantity:    ${body.quantity ?? 1}
  Total Value: ${currency} ${totalValue.toLocaleString()}`;
}

function buildPrompt(body: Record<string, unknown>): string {
  const hsDossierLine =
    typeof body.hsDossierDate === 'string' && body.hsDossierDate
      ? `\n  HS Dossier:    An 'HS Dossier \u2013 ${body.hsCode}' has been generated on ${new Date(body.hsDossierDate).toLocaleDateString('en-CA', { dateStyle: 'long' })}. Where appropriate, reference 'as per HS Dossier dated ${new Date(body.hsDossierDate).toLocaleDateString('en-CA', { dateStyle: 'long' })}' in the goods description or annex. Do not restate the full dossier content.`
      : '';

  return `DEAL PARAMETERS

PARTIES
  Seller: ${body.sellerName}
  Buyer:  ${body.buyerName} (${body.buyerCountry})

PRODUCT
  Description:   ${body.productDescription}
  HS Code:       ${body.hsCode}
  HS Description: ${body.hsDescription ?? ''}
  HS Risk Level: ${body.hsRiskLevel ?? 'Medium'}
  Duty Note:     ${body.hsDutyNote ?? 'Verify applicable duty rates with a licensed customs broker.'}${hsDossierLine}

${buildCommercialTerms(body)}

LOGISTICS
  Incoterm:               ${body.incoterm} — ${body.incotermPlace ?? '(named place not specified)'}
  Freight Responsibility: ${body.freightResponsibility ?? 'Seller'}
  Insurance Responsibility: ${body.insuranceResponsibility ?? 'Seller'}

PAYMENT & DELIVERY
  Payment Method: ${body.paymentMethod ?? 'To be agreed'}
  Payment Terms:  ${body.paymentTerms ?? 'To be agreed'}
  Delivery Date:  ${body.deliveryDate ? new Date(body.deliveryDate as string).toLocaleDateString('en-CA', { dateStyle: 'long' }) : 'To be agreed by the parties'}

Draft the full international sale of goods contract now.`;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  for (const field of ['sellerName', 'buyerName', 'buyerCountry', 'productDescription', 'hsCode', 'incoterm']) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }

  try {
    const contractText = await callClaudeWithRetry(
      { system: SYSTEM_PROMPT, user: buildPrompt(body), maxTokens: 2048 },
      2
    );
    return NextResponse.json({ contractText });
  } catch (error) {
    console.error('[mercorama] Deal contract generation error:', error);
    return NextResponse.json(
      { error: 'Contract generation failed. Please try again.' },
      { status: 500 }
    );
  }
}
