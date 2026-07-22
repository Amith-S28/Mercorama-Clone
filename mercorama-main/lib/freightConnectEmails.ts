// lib/freightConnectEmails.ts
// Transactional email notifications for Freight Connect
import 'server-only';

import { Resend } from 'resend';
import { config } from '@/lib/config';

function resend() {
  return new Resend(config.resendApiKey);
}

const BASE_URL = 'https://mercorama.com';

// ─── New lead — quote_only ────────────────────────────────────────────────────

export async function sendNewLeadQuoteOnly(params: {
  toEmail:        string;
  companyName:    string;
  quoteRequestId: string;
  productCategory: string;
  targetMarket:   string;
  shippingMode:   string;
  estimatedVolume: string;
  responseDeadline: string;  // ISO string
}): Promise<void> {
  const deadline = new Date(params.responseDeadline).toLocaleString('en-CA', {
    timeZone: 'America/Toronto',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  await resend().emails.send({
    from:    config.resendFromEmail,
    to:      params.toEmail,
    subject: `New freight quote request — ${params.targetMarket} (${params.shippingMode})`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0f172a;padding:20px 24px;border-radius:8px 8px 0 0;">
          <p style="color:#fff;font-size:18px;font-weight:700;margin:0;">
            New Quote Request — Mercorama Freight Connect
          </p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <p>Hi <strong>${params.companyName}</strong>,</p>
          <p>You have a new quote request on <strong>Mercorama Freight Connect</strong>.</p>

          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:8px 0;color:#64748b;font-size:14px;width:40%;">Product category</td>
              <td style="padding:8px 0;font-size:14px;font-weight:600;">${params.productCategory}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:8px 0;color:#64748b;font-size:14px;">Destination market</td>
              <td style="padding:8px 0;font-size:14px;font-weight:600;">${params.targetMarket}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:8px 0;color:#64748b;font-size:14px;">Shipping mode</td>
              <td style="padding:8px 0;font-size:14px;font-weight:600;">${params.shippingMode}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:14px;">Est. shipment volume</td>
              <td style="padding:8px 0;font-size:14px;font-weight:600;">${params.estimatedVolume} / year</td>
            </tr>
          </table>

          <div style="background:#fef9c3;border:1px solid #fde047;border-radius:6px;padding:12px 16px;margin:16px 0;">
            <p style="margin:0;font-size:13px;color:#713f12;">
              <strong>SLA deadline:</strong> You must respond by <strong>${deadline} (ET)</strong>.
              Missing the deadline will count as a missed response toward your SLA limit.
            </p>
          </div>

          <p style="color:#475569;font-size:13px;">
            The SME's full identity is hidden until they choose to reveal it. Reply with your rate estimate and transit time to connect.
          </p>

          <a href="${BASE_URL}/freight-connect/forwarder/quotes?id=${params.quoteRequestId}"
             style="display:inline-block;background:#0f172a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px;">
            View &amp; Respond →
          </a>

          <p style="font-size:12px;color:#94a3b8;margin-top:24px;">
            Mercorama Freight Connect · <a href="${BASE_URL}" style="color:#94a3b8;">mercorama.com</a><br>
            You are receiving this because you are a registered forwarder on Freight Connect.
          </p>
        </div>
      </div>
    `,
  });
}

// ─── New lead — anonymised_profile ───────────────────────────────────────────

export async function sendNewLeadAnonymisedProfile(params: {
  toEmail:           string;
  companyName:       string;
  quoteRequestId:    string;
  productCategory:   string;
  hsChapter:         string;
  targetMarket:      string;
  originProvince:    string;
  shippingMode:      string;
  estimatedVolume:   string;
  additionalNotes?:  string;
  responseDeadline:  string;
}): Promise<void> {
  const deadline = new Date(params.responseDeadline).toLocaleString('en-CA', {
    timeZone: 'America/Toronto',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  await resend().emails.send({
    from:    config.resendFromEmail,
    to:      params.toEmail,
    subject: `New freight quote request (+ profile) — ${params.targetMarket}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0f172a;padding:20px 24px;border-radius:8px 8px 0 0;">
          <p style="color:#fff;font-size:18px;font-weight:700;margin:0;">
            New Quote Request + Anonymised Profile
          </p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <p>Hi <strong>${params.companyName}</strong>,</p>
          <p>You have a new <strong>Anonymised Profile</strong> quote request — this includes additional detail about the shipper beyond the standard quote request.</p>

          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:8px 0;color:#64748b;font-size:14px;width:40%;">Product category</td>
              <td style="padding:8px 0;font-size:14px;font-weight:600;">${params.productCategory}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:8px 0;color:#64748b;font-size:14px;">HS chapter</td>
              <td style="padding:8px 0;font-size:14px;font-weight:600;">${params.hsChapter}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:8px 0;color:#64748b;font-size:14px;">Origin province</td>
              <td style="padding:8px 0;font-size:14px;font-weight:600;">${params.originProvince}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:8px 0;color:#64748b;font-size:14px;">Destination market</td>
              <td style="padding:8px 0;font-size:14px;font-weight:600;">${params.targetMarket}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:8px 0;color:#64748b;font-size:14px;">Shipping mode</td>
              <td style="padding:8px 0;font-size:14px;font-weight:600;">${params.shippingMode}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:8px 0;color:#64748b;font-size:14px;">Est. volume</td>
              <td style="padding:8px 0;font-size:14px;font-weight:600;">${params.estimatedVolume} / year</td>
            </tr>
            ${params.additionalNotes ? `
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:14px;vertical-align:top;">Notes</td>
              <td style="padding:8px 0;font-size:14px;">${params.additionalNotes}</td>
            </tr>` : ''}
          </table>

          <div style="background:#fef9c3;border:1px solid #fde047;border-radius:6px;padding:12px 16px;margin:16px 0;">
            <p style="margin:0;font-size:13px;color:#713f12;">
              <strong>SLA deadline:</strong> Respond by <strong>${deadline} (ET)</strong>.
            </p>
          </div>

          <a href="${BASE_URL}/freight-connect/forwarder/quotes?id=${params.quoteRequestId}"
             style="display:inline-block;background:#0f172a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px;">
            View &amp; Respond →
          </a>

          <p style="font-size:12px;color:#94a3b8;margin-top:24px;">
            Mercorama Freight Connect · <a href="${BASE_URL}" style="color:#94a3b8;">mercorama.com</a>
          </p>
        </div>
      </div>
    `,
  });
}

// ─── SME: quote response received ────────────────────────────────────────────

export async function sendQuoteReceivedToSme(params: {
  toEmail:         string;
  forwarderName:   string;
  targetMarket:    string;
  shippingMode:    string;
  rateEstimate?:   string;
  transitTime?:    string;
  quoteRequestId:  string;
}): Promise<void> {
  await resend().emails.send({
    from:    config.resendFromEmail,
    to:      params.toEmail,
    subject: `Quote received from ${params.forwarderName} — Freight Connect`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0f172a;padding:20px 24px;border-radius:8px 8px 0 0;">
          <p style="color:#fff;font-size:18px;font-weight:700;margin:0;">
            Quote Response Received
          </p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <p>Good news — <strong>${params.forwarderName}</strong> has responded to your freight quote request.</p>

          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:8px 0;color:#64748b;font-size:14px;width:40%;">Destination market</td>
              <td style="padding:8px 0;font-size:14px;font-weight:600;">${params.targetMarket}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:8px 0;color:#64748b;font-size:14px;">Shipping mode</td>
              <td style="padding:8px 0;font-size:14px;font-weight:600;">${params.shippingMode}</td>
            </tr>
            ${params.rateEstimate ? `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:8px 0;color:#64748b;font-size:14px;">Rate estimate</td>
              <td style="padding:8px 0;font-size:14px;font-weight:600;">${params.rateEstimate}</td>
            </tr>` : ''}
            ${params.transitTime ? `
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:14px;">Transit time</td>
              <td style="padding:8px 0;font-size:14px;font-weight:600;">${params.transitTime}</td>
            </tr>` : ''}
          </table>

          <p style="color:#475569;font-size:13px;">
            Log in to view the full response, reveal your identity to the forwarder, and continue the conversation.
          </p>

          <a href="${BASE_URL}/freight-connect/quotes"
             style="display:inline-block;background:#0f172a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px;">
            View in Quote Inbox →
          </a>

          <p style="font-size:12px;color:#94a3b8;margin-top:24px;">
            Mercorama Freight Connect · <a href="${BASE_URL}" style="color:#94a3b8;">mercorama.com</a>
          </p>
        </div>
      </div>
    `,
  });
}

// ─── Forwarder: SME identity revealed ────────────────────────────────────────

export async function sendIdentityRevealedToForwarder(params: {
  toEmail:         string;
  companyName:     string;
  smeCompanyName:  string;
  smeEmail:        string;
  targetMarket:    string;
  quoteRequestId:  string;
}): Promise<void> {
  await resend().emails.send({
    from:    config.resendFromEmail,
    to:      params.toEmail,
    subject: `Shipper identity revealed — ${params.smeCompanyName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0f172a;padding:20px 24px;border-radius:8px 8px 0 0;">
          <p style="color:#fff;font-size:18px;font-weight:700;margin:0;">
            Shipper Identity Revealed
          </p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <p>Hi <strong>${params.companyName}</strong>,</p>
          <p>
            The shipper has revealed their identity for the <strong>${params.targetMarket}</strong> quote request.
            You can now contact them directly.
          </p>

          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:16px;margin:16px 0;">
            <p style="margin:0 0 4px 0;font-size:14px;color:#166534;font-weight:700;">Shipper Contact</p>
            <p style="margin:0;font-size:15px;font-weight:600;">${params.smeCompanyName}</p>
            <p style="margin:4px 0 0 0;font-size:14px;">
              <a href="mailto:${params.smeEmail}" style="color:#15803d;">${params.smeEmail}</a>
            </p>
          </div>

          <p style="font-size:13px;color:#475569;">
            Please reach out directly to move forward with the shipment. Continue to uphold your quoted rate and transit time.
          </p>

          <p style="font-size:12px;color:#94a3b8;margin-top:24px;">
            Mercorama Freight Connect · <a href="${BASE_URL}" style="color:#94a3b8;">mercorama.com</a>
          </p>
        </div>
      </div>
    `,
  });
}

// ─── Forwarder: welcome after claiming ───────────────────────────────────────

export async function sendForwarderWelcomeEmail(params: {
  toEmail:     string;
  companyName: string;
  forwarderId: string;
}): Promise<void> {
  await resend().emails.send({
    from:    config.resendFromEmail,
    to:      params.toEmail,
    subject: `Welcome to Mercorama Freight Connect — your listing is live`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0f172a;padding:20px 24px;border-radius:8px 8px 0 0;">
          <p style="color:#fff;font-size:18px;font-weight:700;margin:0;">
            Welcome to Freight Connect
          </p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
          <p>Hi <strong>${params.companyName}</strong>,</p>
          <p>
            Your listing on <strong>Mercorama Freight Connect</strong> is now live and active.
            You will receive email notifications whenever a matching SME requests a quote.
          </p>

          <h3 style="font-size:15px;margin-top:20px;">What happens next?</h3>
          <ul style="font-size:14px;color:#475569;line-height:1.8;">
            <li>SMEs will find your listing when searching by lane, shipping mode, or HS chapter</li>
            <li>You'll receive an email for each new quote request within seconds</li>
            <li>You have a <strong>48-hour SLA</strong> to respond to each request</li>
            <li>Upgrade to Verified or Featured for free leads + premium placement</li>
          </ul>

          <a href="${BASE_URL}/freight-connect/upgrade"
             style="display:inline-block;background:#0f172a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;margin-top:16px;">
            View Upgrade Options →
          </a>

          <p style="font-size:12px;color:#94a3b8;margin-top:24px;">
            Mercorama Freight Connect · <a href="${BASE_URL}" style="color:#94a3b8;">mercorama.com</a><br>
            Questions? Email <a href="mailto:support@mercorama.com" style="color:#94a3b8;">support@mercorama.com</a>
          </p>
        </div>
      </div>
    `,
  });
}
