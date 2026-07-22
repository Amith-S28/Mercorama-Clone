// app/api/deal/hs-dossier/route.ts
// Generates an HTML-stub HS Dossier "PDF" for a deal.
// Accepts all required deal fields in the request body (deals are localStorage-backed,
// so the client passes the data rather than a bare dealId lookup).

import { NextRequest, NextResponse } from 'next/server';

// ─── Input types ──────────────────────────────────────────────────────────────

interface DealInput {
  sellerName: string;
  buyerName: string;
  buyerCountry: string;
  productDescription: string;
  hsCode: string;
  hsDescription: string;
  hsRiskLevel: 'High' | 'Medium' | 'Low';
  hsDutyNote: string;
  incoterm?: string;
}

interface DossierSelectedCode {
  code: string;
  description: string;
  confidenceScore: number;
  confidenceLevel: string;
  griBasis: string[];
  mercoramaReasoning: string;
}

interface DossierInput {
  selectedCode: DossierSelectedCode;
  references: {
    supportingRulings: { id: string; url: string; jurisdiction: string }[];
    notesCited: string[];
  };
  attestation: {
    standardizedItemDescription: string;
    descriptionQuality: string;
  };
  indentAnalysis: { level: number; heading: string; title: string; analysis: string }[];
  risk: {
    overallRiskLevel: string;
    misclassificationRisks: string[];
    recommendedEvidence: string[];
  };
  duty: {
    estimatedRate: string | null;
    basis: string | null;
    notes: string | null;
  };
}

// ─── HTML builder ─────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHsDossierHtml(
  dealId: string,
  deal: DealInput,
  generatedAt: string,
  dossier?: DossierInput
): string {
  const dateStr = new Date(generatedAt).toLocaleDateString('en-CA', { dateStyle: 'long' });
  const riskColor: Record<string, string> = {
    High: '#dc2626',
    Medium: '#d97706',
    Low: '#16a34a',
  };
  const rCol = riskColor[deal.hsRiskLevel] ?? '#6b7280';

  // Indent analysis
  let indentSection = '';
  if (dossier?.indentAnalysis?.length) {
    const rows = dossier.indentAnalysis
      .map(
        (e) =>
          `<tr>
            <td style="padding-left:${(e.level - 1) * 16 + 8}px;font-family:monospace;font-weight:600;color:#2563eb">${esc(e.heading)}</td>
            <td>${esc(e.title)}</td>
            <td style="color:#6b7280;font-size:12px">${esc(e.analysis)}</td>
          </tr>`
      )
      .join('');
    indentSection = `
    <section>
      <h2>Classification Walkthrough</h2>
      <table>
        <thead><tr>
          <th>Heading</th><th>Title</th><th>Analysis</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;
  }

  // References
  let refSection = '';
  if (dossier?.references) {
    const rulings = dossier.references.supportingRulings
      .map(
        (r) =>
          `<li>${esc(r.id)} (${esc(r.jurisdiction)})${r.url ? ` — <a href="${esc(r.url)}">${esc(r.url)}</a>` : ''}</li>`
      )
      .join('');
    const notes = dossier.references.notesCited.map((n) => `<li>${esc(n)}</li>`).join('');
    if (rulings || notes) {
      refSection = `
    <section>
      <h2>Legal References</h2>
      ${rulings ? `<p class="sub-heading">Supporting Rulings</p><ul>${rulings}</ul>` : ''}
      ${notes ? `<p class="sub-heading">Notes Cited</p><ul>${notes}</ul>` : ''}
    </section>`;
    }
  }

  // Risk lists
  const risks =
    dossier?.risk?.misclassificationRisks?.map((r) => `<li>${esc(r)}</li>`).join('') ?? '';
  const evidence =
    dossier?.risk?.recommendedEvidence?.map((e) => `<li>${esc(e)}</li>`).join('') ?? '';

  // Attestation
  const attestationBlock = dossier?.attestation
    ? `<div class="attest">&ldquo;${esc(dossier.attestation.standardizedItemDescription)}&rdquo;</div>`
    : '';

  // Reasoning
  const reasoningBlock = dossier?.selectedCode?.mercoramaReasoning
    ? `<div class="reasoning">${esc(dossier.selectedCode.mercoramaReasoning)}</div>`
    : '';

  const griBasis =
    dossier?.selectedCode?.griBasis?.length
      ? `<p class="sub-heading" style="margin-top:10px">GRI Basis: <strong>${esc(dossier.selectedCode.griBasis.join(', '))}</strong></p>`
      : '';

  const confidence =
    dossier?.selectedCode?.confidenceLevel
      ? `<p style="font-size:12px;color:#6b7280;margin-top:6px">Classification confidence: <strong>${esc(dossier.selectedCode.confidenceLevel)}</strong> (${(dossier.selectedCode.confidenceScore * 100).toFixed(0)}%)</p>`
      : '';

  const incotermSection = deal.incoterm
    ? `
    <section>
      <h2>Logistics</h2>
      <div class="row"><span class="label">Incoterm (Incoterms&reg; 2020)</span><span class="val">${esc(deal.incoterm)}</span></div>
    </section>`
    : '';

  const dutyRate =
    dossier?.duty?.estimatedRate
      ? `<div class="row"><span class="label">Estimated MFN Rate</span><span class="val" style="font-family:monospace">${esc(dossier.duty.estimatedRate)}</span></div>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>HS Dossier &ndash; ${esc(deal.hsCode)}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; max-width: 860px; margin: 40px auto; padding: 0 24px; color: #111; line-height: 1.55; }
    h1 { font-size: 24px; border-bottom: 3px solid #2563eb; padding-bottom: 10px; color: #1e3a5f; margin-bottom: 4px; }
    h2 { font-size: 12px; color: #2563eb; margin: 0 0 14px; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 700; }
    .meta { color: #6b7280; font-size: 12px; margin-bottom: 28px; }
    .code { font-family: monospace; font-size: 30px; font-weight: 700; color: #2563eb; }
    .desc { font-size: 15px; color: #374151; margin-top: 4px; }
    section { margin-bottom: 18px; padding: 18px 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
    ul { padding-left: 20px; margin: 6px 0; }
    li { margin-bottom: 4px; font-size: 13px; }
    p { font-size: 14px; margin: 4px 0 8px; }
    .sub-heading { font-size: 12px; font-weight: 600; color: #374151; margin: 10px 0 4px; text-transform: uppercase; letter-spacing: 0.04em; }
    .row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .label { color: #6b7280; }
    .val { font-weight: 600; }
    .reasoning { background: #f0f4ff; border-left: 3px solid #2563eb; padding: 10px 14px; border-radius: 0 6px 6px 0; font-size: 13px; color: #374151; margin-top: 12px; line-height: 1.6; }
    .attest { background: #f9fafb; padding: 10px 14px; border-radius: 6px; font-size: 13px; font-style: italic; color: #374151; margin-top: 10px; }
    .disclaimer { font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; margin-top: 32px; padding-top: 14px; line-height: 1.6; }
    footer { font-size: 11px; color: #9ca3af; text-align: center; margin-top: 18px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 6px 8px; background: #f3f4f6; font-size: 12px; }
    td { padding: 6px 8px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
    a { color: #2563eb; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>

  <h1>HS Dossier &ndash; ${esc(deal.hsCode)}</h1>
  <p class="meta">Deal ID: ${esc(dealId)} &nbsp;&middot;&nbsp; Generated: ${dateStr} &nbsp;&middot;&nbsp; Issued by Mercorama</p>

  <section>
    <h2>Product &amp; Parties</h2>
    <div class="row"><span class="label">Seller</span><span class="val">${esc(deal.sellerName)}</span></div>
    <div class="row"><span class="label">Buyer</span><span class="val">${esc(deal.buyerName)}</span></div>
    <div class="row"><span class="label">Origin Country</span><span class="val">Canada</span></div>
    <div class="row"><span class="label">Destination Country</span><span class="val">${esc(deal.buyerCountry)}</span></div>
    <p class="sub-heading" style="margin-top:12px">Product Description</p>
    <p style="font-style:italic">${esc(deal.productDescription)}</p>
    ${attestationBlock ? `<p class="sub-heading">Customs-Ready Description (Attestation)</p>${attestationBlock}` : ''}
  </section>

  <section>
    <h2>HS Classification</h2>
    <p class="code">${esc(deal.hsCode)}</p>
    <p class="desc">${esc(deal.hsDescription)}</p>
    ${griBasis}
    ${reasoningBlock}
    ${confidence}
  </section>

  ${indentSection}

  <section>
    <h2>Risk &amp; Compliance</h2>
    <div class="row"><span class="label">Overall Risk Level</span><span class="val" style="color:${rCol}">${esc(deal.hsRiskLevel)}</span></div>
    ${risks ? `<p class="sub-heading">Misclassification Risks</p><ul>${risks}</ul>` : ''}
    ${evidence ? `<p class="sub-heading">Recommended Evidence to Retain</p><ul>${evidence}</ul>` : ''}
  </section>

  <section>
    <h2>Duty Snapshot</h2>
    <div class="row"><span class="label">Destination Country</span><span class="val">${esc(deal.buyerCountry)}</span></div>
    ${dutyRate}
    <p style="margin-top:8px;font-size:13px">${esc(deal.hsDutyNote)}</p>
    <p style="font-size:11px;color:#9ca3af;margin-top:4px">Always verify with the national tariff schedule and a licensed customs broker.</p>
  </section>

  ${refSection}

  ${incotermSection}

  <p class="disclaimer">
    This HS Dossier has been prepared by Mercorama&rsquo;s AI-powered classification engine for informational purposes only.
    It does not constitute a formal customs ruling or binding legal advice. The classification should be verified with a
    licensed customs broker and cross-referenced against the applicable national tariff schedule before filing entry documents.
    Mercorama accepts no liability for customs penalties arising from reliance on this document without independent verification.
  </p>

  <footer>Mercorama &copy; ${new Date().getFullYear()} &nbsp;&middot;&nbsp; HS Dossier &ndash; ${esc(deal.hsCode)} &nbsp;&middot;&nbsp; Generated ${dateStr}</footer>

</body>
</html>`;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: {
    dealId?: unknown;
    deal?: unknown;
    dossier?: unknown;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body.dealId !== 'string' || !body.dealId.trim()) {
    return NextResponse.json({ error: 'Missing required field: dealId' }, { status: 400 });
  }

  const deal = body.deal as DealInput | undefined;
  if (!deal || typeof deal !== 'object') {
    return NextResponse.json({ error: 'Missing required field: deal' }, { status: 400 });
  }

  for (const field of ['sellerName', 'buyerName', 'buyerCountry', 'productDescription', 'hsCode', 'hsDescription', 'hsRiskLevel', 'hsDutyNote'] as const) {
    if (!deal[field]) {
      return NextResponse.json({ error: `Missing required deal field: ${field}` }, { status: 400 });
    }
  }

  const dealId = body.dealId.trim();
  const dossier = body.dossier as DossierInput | undefined;
  const generatedAt = new Date().toISOString();
  const title = `HS Dossier \u2013 ${deal.hsCode}`;

  try {
    const html = buildHsDossierHtml(dealId, deal, generatedAt, dossier);
    const b64 = Buffer.from(html, 'utf-8').toString('base64');
    const fileUrl = `data:text/html;charset=utf-8;base64,${b64}`;

    return NextResponse.json({ title, type: 'HS_DOSSIER', fileUrl, generatedAt });
  } catch (error) {
    console.error('[mercorama] HS Dossier generation error:', error);
    return NextResponse.json(
      { error: 'Dossier generation failed. Please try again.' },
      { status: 500 }
    );
  }
}
