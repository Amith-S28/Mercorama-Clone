// app/api/fta-diversify/email-report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { Resend } from 'resend';
import React, { type JSXElementConstructor, type ReactElement } from 'react';
import { config } from '@/lib/config';
import { FtaReportPdf } from '@/lib/fta-report-pdf';
import type { FtaDiversifySession, FtaMarketSummary } from '@/lib/fta-diversify';

// ─── Email HTML template ───────────────────────────────────────────────────────

function buildEmailHtml(session: FtaDiversifySession, markets: FtaMarketSummary[]): string {
  const productLabel = session.productDescription.slice(0, 80);
  const marketList = markets
    .map(
      (m) =>
        `<li style="margin-bottom:6px"><strong>${m.country}</strong> <span style="background:#0d9488;color:#fff;font-size:11px;padding:2px 8px;border-radius:99px;font-weight:600">${m.ftaName}</span></li>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">

          <!-- Header -->
          <tr>
            <td style="background:#0f172a;padding:20px 32px;text-align:left">
              <img src="https://mercorama.com/mercorama_logo_2026.png" alt="Mercorama" height="32" style="display:block" />
            </td>
          </tr>

          <!-- Teal band -->
          <tr>
            <td style="background:#0d9488;padding:16px 32px">
              <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:700">Your FTA Diversification Report is ready</h1>
              <p style="margin:6px 0 0;color:#ccfbf1;font-size:13px">${productLabel}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 32px">
              <p style="margin:0 0 16px;color:#1e293b;font-size:15px">Hi there,</p>
              <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6">
                Your Canada FTA Diversification Report is attached as a PDF. It covers
                <strong>${markets.length} FTA-backed market${markets.length !== 1 ? 's' : ''}</strong>
                identified for your product under Canada's active trade agreements.
              </p>

              <!-- Market list -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:24px">
                <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#0f172a;text-transform:uppercase;letter-spacing:0.05em">Markets covered</p>
                <ul style="margin:0;padding-left:18px;color:#475569;font-size:14px">
                  ${marketList}
                </ul>
              </div>

              <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6">
                Open the attached PDF to view the full market snapshots, tariff advantages, spending trends, and risk flags for each market.
              </p>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:28px">
                <a href="https://mercorama.com/dashboard?tool=fta-diversify"
                   style="background:#0d9488;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block">
                  Run another analysis →
                </a>
              </div>

              <!-- Cross-promo -->
              <div style="border-top:1px solid #e2e8f0;padding-top:24px">
                <p style="margin:0 0 14px;font-size:13px;font-weight:600;color:#0f172a">More tools to grow your exports</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="48%" valign="top" style="padding-right:8px">
                      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 14px;margin-bottom:10px">
                        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#0f172a">HS Code Assistant</p>
                        <p style="margin:0 0 6px;font-size:12px;color:#64748b;line-height:1.4">GRI-based product classification with duty rates and risk flags.</p>
                        <a href="https://mercorama.com/hscode" style="color:#0d9488;font-size:12px;font-weight:600;text-decoration:none">Try it →</a>
                      </div>
                      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 14px">
                        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#0f172a">Deal Wizard</p>
                        <p style="margin:0 0 6px;font-size:12px;color:#64748b;line-height:1.4">Build your export plan — from HS code through Incoterm to an export-ready deal summary.</p>
                        <a href="https://mercorama.com/deal" style="color:#0d9488;font-size:12px;font-weight:600;text-decoration:none">Try it →</a>
                      </div>
                    </td>
                    <td width="48%" valign="top" style="padding-left:8px">
                      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 14px;margin-bottom:10px">
                        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#0f172a">Incoterms Analyzer</p>
                        <p style="margin:0 0 6px;font-size:12px;color:#64748b;line-height:1.4">Plain-language breakdown of responsibilities and risk transfer points.</p>
                        <a href="https://mercorama.com/incoterms" style="color:#0d9488;font-size:12px;font-weight:600;text-decoration:none">Try it →</a>
                      </div>
                      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 14px">
                        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#0f172a">Deal Wizard</p>
                        <p style="margin:0 0 6px;font-size:12px;color:#64748b;line-height:1.4">HS Code to signed export contract in 4 guided steps.</p>
                        <a href="https://mercorama.com/deal" style="color:#0d9488;font-size:12px;font-weight:600;text-decoration:none">Try it →</a>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center">
              <p style="margin:0 0 4px;font-size:12px;color:#94a3b8">
                © 2026 MERCORAMA powered by <a href="https://mightyiq.ca" style="color:#94a3b8">MightyIQ Inc.</a> · All rights reserved
              </p>
              <p style="margin:0;font-size:12px;color:#94a3b8">Made for export driven SMEs worldwide 🌍</p>
              <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1">
                This report is for informational purposes only. Always verify with a licensed customs broker.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!config.resendApiKey) {
    return NextResponse.json(
      { error: 'Email service is not configured. Please contact support.' },
      { status: 503 }
    );
  }

  let body: {
    email: string;
    session: FtaDiversifySession;
    markets: FtaMarketSummary[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { email, session, markets } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
  }
  if (!Array.isArray(markets) || markets.length === 0) {
    return NextResponse.json({ error: 'No markets provided.' }, { status: 400 });
  }

  // Resolve logo path from filesystem
  const logoPath = path.join(process.cwd(), 'public', 'mercorama_logo_2026.png');

  // Generate PDF
  let pdfBuffer: Buffer;
  try {
    const element = React.createElement(FtaReportPdf, { logoPath, session, markets });
    pdfBuffer = await renderToBuffer(
      element as ReactElement<DocumentProps, JSXElementConstructor<DocumentProps>>
    );
  } catch (err) {
    console.error('[mercorama] FTA email-report — PDF generation failed:', err);
    return NextResponse.json({ error: 'Failed to generate PDF. Please try again.' }, { status: 500 });
  }

  // Send via Resend
  const resend = new Resend(config.resendApiKey);
  const productLabel = session.productDescription.slice(0, 60);

  try {
    const { error } = await resend.emails.send({
      from: config.resendFromEmail,
      to: email,
      subject: `Your FTA Diversification Report — ${productLabel}`,
      html: buildEmailHtml(session, markets),
      attachments: [
        {
          filename: `mercorama-fta-report-${session.id.slice(0, 8)}.pdf`,
          content: pdfBuffer.toString('base64'),
        },
      ],
    });

    if (error) {
      console.error('[mercorama] FTA email-report — Resend error:', error);
      return NextResponse.json({ error: 'Failed to send email. Please try again.' }, { status: 500 });
    }
  } catch (err) {
    console.error('[mercorama] FTA email-report — unexpected send error:', err);
    return NextResponse.json({ error: 'Failed to send email. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
