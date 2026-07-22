// app/api/deal/deal-dossier/route.ts
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import React, { type JSXElementConstructor, type ReactElement } from 'react';
import { DealDossierPdf } from '@/lib/deal-dossier-pdf';
import type { Deal } from '@/lib/deals';
import type { DealItem } from '@/lib/deal-items';
import type { HsClassificationResult } from '@/app/hscode/_components/hs-classifier';

export async function POST(req: NextRequest) {
  let body: {
    deal: Deal;
    items: DealItem[];
    dossier: HsClassificationResult | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { deal, items, dossier } = body;

  if (!deal?.id) {
    return NextResponse.json({ error: 'Deal data is required.' }, { status: 400 });
  }

  const logoPath = path.join(process.cwd(), 'public', 'mercorama_logo_2026.png');

  let pdfBuffer: Buffer;
  try {
    const element = React.createElement(DealDossierPdf, {
      logoPath,
      deal,
      items: items ?? [],
      dossier: dossier ?? null,
    });
    pdfBuffer = await renderToBuffer(
      element as ReactElement<DocumentProps, JSXElementConstructor<DocumentProps>>
    );
  } catch (err) {
    console.error('[mercorama] deal-dossier — PDF generation failed:', err);
    return NextResponse.json({ error: 'Failed to generate PDF. Please try again.' }, { status: 500 });
  }

  const filename = `mercorama-deal-dossier-${deal.id.slice(0, 8)}.pdf`;

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdfBuffer.length),
    },
  });
}
