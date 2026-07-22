// app/api/export-compass/email-report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { Resend } from 'resend';
import React, { type JSXElementConstructor, type ReactElement } from 'react';
import { config } from '@/lib/config';
import { ExportCompassReportPdf } from '@/lib/export-compass-report-pdf';
import type { ExportCompassSession } from '@/lib/export-compass';

// ─── Email HTML template ───────────────────────────────────────────────────────

function buildEmailHtml(session: ExportCompassSession): string {
  const productLabel = session.productLabel.slice(0, 80);
  const markets = session.recommendedMarkets;

  const marketList = markets
    .slice(0, 10)
    .map(
      (m) =>
        `<li style="margin-bottom:6px">
          <strong>${m.country}</strong>
          ${m.ftaAvailable && m.ftaName ? `<span style="background:#0d9488;color:#fff;font-size:11px;padding:2px 8px;border-radius:99px;font-weight:600;margin-left:6px">${m.ftaName}</span>` : ''}
          <span style="color:#64748b;font-size:12px;margin-left:6px">Export Score: <strong>${m.exportScore}</strong></span>
        </li>`
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

          <!-- Indigo band -->
          <tr>
            <td style="background:#4338ca;padding:16px 32px">
              <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:700">Your Export Compass Report is ready</h1>
              <p style="margin:6px 0 0;color:#e0e7ff;font-size:13px">${productLabel}${session.hsCode ? ` · HS ${session.hsCode}` : ''}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 32px">
              <p style="margin:0 0 16px;color:#1e293b;font-size:15px">Hi there,</p>
              <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6">
                Your Export Compass Report is attached as a PDF. It covers the
                <strong>top ${markets.length} global export markets</strong>
                for <strong>${productLabel}</strong>, ranked by Mercorama's AI-powered Export Score across
                demand, growth, FTA access, logistics, and risk.
              </p>

              <!-- Market list -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:24px">
                <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#0f172a;text-transform:uppercase;letter-spacing:0.05em">Top markets</p>
                <ul style="margin:0;padding-left:18px;color:#475569;font-size:14px">
                  ${marketList}
                </ul>
              </div>

              <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6">
                Open the attached PDF to view the full market snapshots, tariff advantages, competitor analysis, and AI-generated insights for each market.
              </p>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:28px">
                <a href="https://mercorama.com/dashboard?tool=export-compass"
                   style="background:#4338ca;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block">
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
                        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#0f172a">FTA Diversify Wizard</p>
                        <p style="margin:0 0 6px;font-size:12px;color:#64748b;line-height:1.4">Discover FTA-backed markets with AI snapshots and branded PDF reports.</p>
                        <a href="https://mercorama.com/fta-diversify" style="color:#0d9488;font-size:12px;font-weight:600;text-decoration:none">Try it →</a>
                      </div>
                      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 14px">
                        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#0f172a">HS Code Assistant</p>
                        <p style="margin:0 0 6px;font-size:12px;color:#64748b;line-height:1.4">GRI-based product classification with duty rates and risk flags.</p>
                        <a href="https://mercorama.com/hscode" style="color:#0d9488;font-size:12px;font-weight:600;text-decoration:none">Try it →</a>
                      </div>
                    </td>
                    <td width="48%" valign="top" style="padding-left:8px">
                      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 14px;margin-bottom:10px">
                        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#0f172a">Deal Wizard</p>
                        <p style="margin:0 0 6px;font-size:12px;color:#64748b;line-height:1.4">HS Code to signed export contract in 4 guided steps.</p>
                        <a href="https://mercorama.com/deal" style="color:#0d9488;font-size:12px;font-weight:600;text-decoration:none">Try it →</a>
                      </div>
                      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 14px">
                        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#0f172a">Deal Wizard</p>
                        <p style="margin:0 0 6px;font-size:12px;color:#64748b;line-height:1.4">Build your export plan — from HS code through Incoterm to an export-ready deal summary.</p>
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
                Export scores are AI-generated estimates. Always verify with a licensed customs broker.
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

  let body: { email: string; session: ExportCompassSession };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { email, session } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
  }
  if (!session?.recommendedMarkets?.length) {
    return NextResponse.json({ error: 'No markets provided.' }, { status: 400 });
  }

  const logoPath = path.join(process.cwd(), 'public', 'mercorama_logo_2026.png');

  let pdfBuffer: Buffer;
  try {
    const element = React.createElement(ExportCompassReportPdf, { logoPath, session });
    pdfBuffer = await renderToBuffer(
      element as ReactElement<DocumentProps, JSXElementConstructor<DocumentProps>>
    );
  } catch (err) {
    console.error('[mercorama] Export Compass email-report — PDF generation failed:', err);
    return NextResponse.json({ error: 'Failed to generate PDF. Please try again.' }, { status: 500 });
  }

  const resend = new Resend(config.resendApiKey);
  const productLabel = session.productLabel.slice(0, 60);

  try {
    const { error } = await resend.emails.send({
      from: config.resendFromEmail,
      to: email,
      subject: `Your Export Compass Report — ${productLabel}`,
      html: buildEmailHtml(session),
      attachments: [
        {
          filename: `mercorama-export-compass-${session.id.slice(0, 8)}.pdf`,
          content: pdfBuffer.toString('base64'),
        },
      ],
    });

    if (error) {
      console.error('[mercorama] Export Compass email-report — Resend error:', error);
      return NextResponse.json({ error: 'Failed to send email. Please try again.' }, { status: 500 });
    }
  } catch (err) {
    console.error('[mercorama] Export Compass email-report — unexpected send error:', err);
    return NextResponse.json({ error: 'Failed to send email. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
