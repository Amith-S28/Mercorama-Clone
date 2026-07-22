// lib/betaEmails.ts
// Transactional emails for the /beta cohort application flow.
import { Resend } from 'resend';
import { config } from '@/lib/config';

const LINKEDIN_URL = 'https://www.linkedin.com/company/mercorama';

function firstName(fullName: string): string {
  return fullName.trim().split(' ')[0];
}

function planDisplayName(plan: string): string {
  if (plan === 'starter') return 'Starter — $99 CAD/mo founding · $149 CAD/mo public';
  if (plan === 'growth')  return 'Growth — $299 CAD/mo founding · $349 CAD/mo public';
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

export async function sendBetaApplicationConfirmation({
  toEmail,
  fullName,
  selectedPlan,
}: {
  toEmail:      string;
  fullName:     string;
  selectedPlan: string;
}) {
  if (!config.resendApiKey) return;
  const resend = new Resend(config.resendApiKey);

  await resend.emails.send({
    from:    config.resendFromEmail,
    to:      toEmail,
    subject: 'Your Mercorama Cohort 1 application',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0f172a;padding:20px 24px;border-radius:8px 8px 0 0;">
          <p style="color:#fff;font-size:18px;font-weight:700;margin:0;">Mercorama</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:28px 24px;border-radius:0 0 8px 8px;">
          <p style="margin:0 0 16px;">Hi ${firstName(fullName)},</p>
          <p style="margin:0 0 16px;">
            We've received your Cohort 1 application.
            We review every application personally and will be in touch within 48 hours.
          </p>
          <p style="margin:0 0 16px;">
            <strong>What you applied for:</strong><br/>
            ${planDisplayName(selectedPlan)}
          </p>
          <p style="margin:0 0 24px;">
            <a href="${LINKEDIN_URL}"
               style="color:#0f172a;font-weight:600;text-decoration:none;">
              Follow our journey on LinkedIn while you wait →
            </a>
          </p>
          <p style="margin:0 0 16px;">
            Questions? Reply directly to this email.
            I read every response personally.
          </p>
          <p style="margin:0 0 32px;">
            The Mercorama Team<br/>
            Founder, Mercorama
          </p>
          <p style="font-size:12px;color:#94a3b8;margin:0;">
            Mercorama ·
            <a href="https://mercorama.com" style="color:#94a3b8;">mercorama.com</a>
          </p>
        </div>
      </div>
    `,
  });
}

// ── Email 4 — Waitlist confirmation ──────────────────────────────────────────

export async function sendWaitlistConfirmation({
  toEmail,
  fullName,
}: {
  toEmail:  string;
  fullName: string;
}) {
  if (!config.resendApiKey) return;
  const resend = new Resend(config.resendApiKey);

  await resend.emails.send({
    from:    config.resendFromEmail,
    to:      toEmail,
    subject: "You're on the Mercorama waitlist",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0f172a;padding:20px 24px;border-radius:8px 8px 0 0;">
          <p style="color:#fff;font-size:18px;font-weight:700;margin:0;">Mercorama</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:28px 24px;border-radius:0 0 8px 8px;">
          <p style="margin:0 0 16px;">Hi ${firstName(fullName)},</p>
          <p style="margin:0 0 16px;">
            You're on the list for Cohort 2.
            We'll notify you when spots open — typically within 2–4 weeks.
          </p>
          <p style="margin:0 0 16px;">
            Founding pricing will be available to Cohort 2 members as well.
          </p>
          <p style="margin:0 0 24px;">
            <a href="${LINKEDIN_URL}"
               style="color:#0f172a;font-weight:600;text-decoration:none;">
              Follow our journey on LinkedIn →
            </a>
          </p>
          <p style="margin:0 0 32px;">
            The Mercorama Team<br/>
            Founder, Mercorama
          </p>
          <p style="font-size:12px;color:#94a3b8;margin:0;">
            Mercorama ·
            <a href="https://mercorama.com" style="color:#94a3b8;">mercorama.com</a>
          </p>
        </div>
      </div>
    `,
  });
}

// ── Welcome email (activation complete) ──────────────────────────────────────

export async function sendWelcomeEmail({
  toEmail,
  fullName,
  plan,
  foundingPrice,
  lockedUntil,
  loginUrl,
}: {
  toEmail:      string;
  fullName:     string;
  plan:         string;
  foundingPrice: number;
  lockedUntil:  Date;
  loginUrl:     string;
}) {
  if (!config.resendApiKey) return;
  const resend = new Resend(config.resendApiKey);
  const planName = plan === 'growth' ? 'Growth' : 'Starter';

  await resend.emails.send({
    from:    config.resendFromEmail,
    to:      toEmail,
    subject: 'Welcome to Mercorama — your account is ready',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0f172a;padding:20px 24px;border-radius:8px 8px 0 0;">
          <p style="color:#fff;font-size:18px;font-weight:700;margin:0;">Mercorama</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:28px 24px;border-radius:0 0 8px 8px;">
          <p style="margin:0 0 16px;">Hi ${firstName(fullName)},</p>
          <p style="margin:0 0 16px;">
            Welcome to Mercorama. You're one of our founding members.
          </p>
          <p style="margin:0 0 16px;">
            <strong>Your plan:</strong> ${planName}<br/>
            <strong>Founding price:</strong> $${foundingPrice}/mo CAD<br/>
            <strong>Price locked until:</strong> ${formatDate(lockedUntil)}
          </p>
          <p style="margin:0 0 24px;">
            <a href="${loginUrl}"
               style="display:inline-block;background:#FF6100;color:#fff;font-weight:600;padding:12px 24px;border-radius:6px;text-decoration:none;">
              Log in to your dashboard →
            </a>
          </p>
          <p style="margin:0 0 16px;font-size:13px;color:#64748b;">
            This link expires in 24 hours. If it has expired, visit
            <a href="https://mercorama.com/login" style="color:#64748b;">mercorama.com/login</a>
            to request a new one.
          </p>
          <p style="margin:0 0 32px;">
            The Mercorama Team<br/>
            Founder, Mercorama
          </p>
          <p style="font-size:12px;color:#94a3b8;margin:0;">
            Mercorama ·
            <a href="https://mercorama.com" style="color:#94a3b8;">mercorama.com</a>
          </p>
        </div>
      </div>
    `,
  });
}

// ── Subscription cancelled email ──────────────────────────────────────────────

export async function sendSubscriptionCancelledEmail({
  toEmail,
  fullName,
}: {
  toEmail:  string;
  fullName: string;
}) {
  if (!config.resendApiKey) return;
  const resend = new Resend(config.resendApiKey);

  await resend.emails.send({
    from:    config.resendFromEmail,
    to:      toEmail,
    subject: 'Your Mercorama subscription has been cancelled',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0f172a;padding:20px 24px;border-radius:8px 8px 0 0;">
          <p style="color:#fff;font-size:18px;font-weight:700;margin:0;">Mercorama</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:28px 24px;border-radius:0 0 8px 8px;">
          <p style="margin:0 0 16px;">Hi ${firstName(fullName)},</p>
          <p style="margin:0 0 16px;">
            Your Mercorama subscription has been cancelled.
            Your access will remain active until the end of your current billing period.
          </p>
          <p style="margin:0 0 16px;">
            If you cancelled by mistake or have any questions,
            reply to this email and we'll sort it out.
          </p>
          <p style="margin:0 0 32px;">
            The Mercorama Team<br/>
            Founder, Mercorama
          </p>
          <p style="font-size:12px;color:#94a3b8;margin:0;">
            Mercorama ·
            <a href="https://mercorama.com" style="color:#94a3b8;">mercorama.com</a>
          </p>
        </div>
      </div>
    `,
  });
}

// ── Email 2A — Demo invite ─────────────────────────────────────────────────────

export async function sendDemoInvite({
  toEmail,
  fullName,
  cohortNumber,
  calendlyLink,
}: {
  toEmail:      string;
  fullName:     string;
  cohortNumber: number;
  calendlyLink: string;
}) {
  if (!config.resendApiKey) return;
  const resend = new Resend(config.resendApiKey);

  await resend.emails.send({
    from:    config.resendFromEmail,
    to:      toEmail,
    subject: "You're shortlisted — let's show you Mercorama",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0f172a;padding:20px 24px;border-radius:8px 8px 0 0;">
          <p style="color:#fff;font-size:18px;font-weight:700;margin:0;">Mercorama</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:28px 24px;border-radius:0 0 8px 8px;">
          <p style="margin:0 0 16px;">Hi ${firstName(fullName)},</p>
          <p style="margin:0 0 16px;">
            Great news — you've been shortlisted for Mercorama Cohort ${cohortNumber}.
          </p>
          <p style="margin:0 0 16px;">
            Before we send you access, we'd like to give you a personal 20-minute walkthrough
            so you can see exactly what you're getting.
          </p>
          <p style="margin:0 0 8px;">We'll show you:</p>
          <p style="margin:0 0 4px;padding-left:16px;">→ How your product performs across markets</p>
          <p style="margin:0 0 4px;padding-left:16px;">→ How Deal Wizard calculates your full landed cost to any destination</p>
          <p style="margin:0 0 4px;padding-left:16px;">→ How Fund My Export finds government grants for your specific scenario</p>
          <p style="margin:0 0 16px;padding-left:16px;">→ What's shipping during your 6-month lock period — included at no extra cost</p>
          <p style="margin:0 0 24px;">
            <a href="${calendlyLink}"
               style="display:inline-block;background:#FF6100;color:#fff;font-weight:600;padding:12px 24px;border-radius:6px;text-decoration:none;">
              Book your demo here →
            </a>
          </p>
          <p style="margin:0 0 16px;">
            Slots are available within the next 5 business days.
            Takes 20 minutes. No obligation.
          </p>
          <p style="margin:0 0 32px;">
            Your founding pricing is held for you until your demo slot.
          </p>
          <p style="margin:0 0 32px;">
            The Mercorama Team<br/>
            Founder, Mercorama
          </p>
          <p style="font-size:12px;color:#94a3b8;margin:0;">
            Mercorama ·
            <a href="https://mercorama.com" style="color:#94a3b8;">mercorama.com</a>
          </p>
        </div>
      </div>
    `,
  });
}

// ── Email 2B — Post-demo offer ─────────────────────────────────────────────────

type PlanLimitRow = { label: string; starterQty: string; growthQty: string };
const PLAN_LIMITS: PlanLimitRow[] = [
  { label: 'HS Code Assistant',        starterQty: '30/mo',  growthQty: '100/mo' },
  { label: 'Incoterms Analyzer',       starterQty: '30/mo',  growthQty: '100/mo' },
  { label: 'Deal Summary Generator',   starterQty: '20/mo',  growthQty: '50/mo'  },
  { label: 'Deal Wizard',              starterQty: '10/mo',  growthQty: '30/mo'  },
  { label: 'Fund My Export',           starterQty: '20/mo',  growthQty: '50/mo'  },
  { label: 'FTA Diversify Wizard',     starterQty: '20/mo',  growthQty: '50/mo'  },
  { label: 'Export Compass',           starterQty: '—',      growthQty: '50/mo'  },
];

export async function sendOfferEmail({
  toEmail,
  fullName,
  cohortNumber,
  plan,
  accessCode,
  adminNote,
  demoHeld,
}: {
  toEmail:      string;
  fullName:     string;
  cohortNumber: number;
  plan:         string;
  accessCode:   string;
  adminNote?:   string | null;
  demoHeld?:    boolean;
}) {
  if (!config.resendApiKey) return;
  const resend = new Resend(config.resendApiKey);

  const isGrowth      = plan === 'growth';
  const planName      = isGrowth ? 'Growth' : 'Starter';
  const foundingPrice = isGrowth ? 299 : 99;
  const publicPrice   = isGrowth ? 349 : 149;
  const savings       = publicPrice - foundingPrice;
  const activateUrl   = `${config.siteUrl}/activate?code=${encodeURIComponent(accessCode)}`;

  const introLine = demoHeld
    ? `Great talking with you. As discussed, here's your Cohort ${cohortNumber} access.`
    : `You've been selected for Mercorama Cohort ${cohortNumber} — one of our founding Canadian SME exporters shaping the platform from the ground up.`;

  const noteBlock = adminNote?.trim()
    ? `<div style="border-left:3px solid #FF6100;padding:12px 16px;margin:16px 0;background:#fff8f5;">
        <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">A note from our founder:</p>
        <p style="margin:0;font-style:italic;">${adminNote.trim()}</p>
       </div>`
    : '';

  const limitsRows = PLAN_LIMITS
    .filter((r) => isGrowth || r.label !== 'Export Compass')
    .map((r) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;">→ ${r.label}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;text-align:right;color:#64748b;">
          ${isGrowth ? r.growthQty : r.starterQty}
        </td>
      </tr>`).join('');

  const freightQty = isGrowth ? '50/mo' : '20/mo';

  await resend.emails.send({
    from:    config.resendFromEmail,
    to:      toEmail,
    subject: 'Your Mercorama access is ready — activate now',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0f172a;padding:20px 24px;border-radius:8px 8px 0 0;">
          <p style="color:#fff;font-size:18px;font-weight:700;margin:0;">Mercorama</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:28px 24px;border-radius:0 0 8px 8px;">
          <p style="margin:0 0 16px;">Hi ${firstName(fullName)},</p>
          <p style="margin:0 0 16px;">${introLine}</p>
          ${noteBlock}

          <p style="margin:16px 0 8px;font-weight:700;font-size:15px;border-bottom:2px solid #0f172a;padding-bottom:6px;">
            Your Founding Member Pricing
          </p>
          <p style="margin:0 0 4px;"><strong>${planName} Plan — $${foundingPrice}/mo CAD</strong></p>
          <p style="margin:0 0 4px;color:#64748b;">Public price after launch: $${publicPrice} CAD/mo</p>
          <p style="margin:0 0 16px;color:#16a34a;font-weight:600;">You save $${savings}/mo · $${savings * 12}/yr</p>
          <p style="margin:0 0 16px;">Locked for a minimum of 6 months. No exceptions after public launch.</p>

          <p style="margin:16px 0 8px;font-weight:700;font-size:15px;border-bottom:2px solid #0f172a;padding-bottom:6px;">
            Available to You Now
          </p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            ${limitsRows}
          </table>

          <p style="margin:16px 0 8px;font-weight:700;font-size:15px;border-bottom:2px solid #0f172a;padding-bottom:6px;">
            Shipping During Your Lock Period
          </p>
          <p style="margin:0 0 4px;color:#64748b;font-size:13px;">Added automatically — no extra cost.</p>
          <table style="width:100%;border-collapse:collapse;margin:8px 0 16px;">
            <tr>
              <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;">→ Tariff Engine</td>
              <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;text-align:right;color:#64748b;">Unlimited</td>
            </tr>
            <tr>
              <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;">→ Freight Connect</td>
              <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;text-align:right;color:#64748b;">${freightQty}</td>
            </tr>
            ${isGrowth ? `<tr>
              <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;">→ Buyer Intelligence</td>
              <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;text-align:right;color:#64748b;">50/mo</td>
            </tr>` : ''}
            <tr>
              <td style="padding:6px 8px;">→ AI HS Classifier + GRI</td>
              <td style="padding:6px 8px;text-align:right;color:#64748b;">Upgrade to existing tool</td>
            </tr>
          </table>
          <p style="margin:0 0 24px;font-size:13px;color:#64748b;">
            Every feature ships to you automatically at no extra cost during your 6-month lock.
          </p>

          <p style="margin:0 0 24px;">
            <a href="${activateUrl}"
               style="display:inline-block;background:#FF6100;color:#fff;font-weight:600;padding:14px 28px;border-radius:6px;text-decoration:none;font-size:15px;">
              Activate My Access →
            </a>
          </p>
          <p style="margin:0 0 16px;font-size:13px;color:#64748b;">
            This link expires in 7 days.
            If it expires, reply to this email for a new one.
          </p>
          <p style="margin:0 0 16px;">
            Questions? Reply directly to this email.
            I read every response personally.
          </p>
          <p style="margin:0 0 32px;">
            The Mercorama Team<br/>
            Founder, Mercorama
          </p>
          <p style="font-size:12px;color:#94a3b8;margin:0;">
            Mercorama ·
            <a href="https://mercorama.com" style="color:#94a3b8;">mercorama.com</a>
          </p>
        </div>
      </div>
    `,
  });
}

// ── Email 3 — Rejection ────────────────────────────────────────────────────────

export async function sendRejectionEmail({
  toEmail,
  fullName,
  cohortNumber,
}: {
  toEmail:      string;
  fullName:     string;
  cohortNumber: number;
}) {
  if (!config.resendApiKey) return;
  const resend = new Resend(config.resendApiKey);

  await resend.emails.send({
    from:    config.resendFromEmail,
    to:      toEmail,
    subject: `Re: Your Mercorama Cohort ${cohortNumber} application`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0f172a;padding:20px 24px;border-radius:8px 8px 0 0;">
          <p style="color:#fff;font-size:18px;font-weight:700;margin:0;">Mercorama</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:28px 24px;border-radius:0 0 8px 8px;">
          <p style="margin:0 0 16px;">Hi ${firstName(fullName)},</p>
          <p style="margin:0 0 16px;">
            Thank you for applying to Mercorama Cohort ${cohortNumber}.
          </p>
          <p style="margin:0 0 16px;">
            We received more applications than available spots and were unable
            to include everyone in this cohort.
          </p>
          <p style="margin:0 0 32px;">
            We've added you to the Cohort ${cohortNumber + 1} waitlist —
            you'll be first in line when spots open. We'll be in touch.
          </p>
          <p style="margin:0 0 32px;">
            The Mercorama Team<br/>
            Founder, Mercorama
          </p>
          <p style="font-size:12px;color:#94a3b8;margin:0;">
            Mercorama ·
            <a href="https://mercorama.com" style="color:#94a3b8;">mercorama.com</a>
          </p>
        </div>
      </div>
    `,
  });
}

// ── Email 5 — Waitlist cohort invite ──────────────────────────────────────────

export async function sendWaitlistCohortInvite({
  toEmail,
  fullName,
  cohortNumber,
  maxSpots,
}: {
  toEmail:      string;
  fullName:     string;
  cohortNumber: number;
  maxSpots:     number;
}) {
  if (!config.resendApiKey) return;
  const resend = new Resend(config.resendApiKey);

  await resend.emails.send({
    from:    config.resendFromEmail,
    to:      toEmail,
    subject: `Mercorama Cohort ${cohortNumber} is open — you're invited`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0f172a;padding:20px 24px;border-radius:8px 8px 0 0;">
          <p style="color:#fff;font-size:18px;font-weight:700;margin:0;">Mercorama</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:28px 24px;border-radius:0 0 8px 8px;">
          <p style="margin:0 0 16px;">Hi ${firstName(fullName)},</p>
          <p style="margin:0 0 16px;">
            You're on the Mercorama waitlist — and Cohort ${cohortNumber} is now open.
          </p>
          <p style="margin:0 0 16px;">
            We're selecting ${maxSpots} Canadian SME exporters for this cohort.
            Spots fill quickly.
          </p>
          <p style="margin:0 0 24px;">
            <a href="${config.siteUrl}/beta"
               style="display:inline-block;background:#FF6100;color:#fff;font-weight:600;padding:12px 24px;border-radius:6px;text-decoration:none;">
              Apply for Cohort ${cohortNumber} →
            </a>
          </p>
          <p style="margin:0 0 32px;color:#64748b;font-size:13px;">
            This invitation expires in 48 hours.
          </p>
          <p style="margin:0 0 32px;">
            The Mercorama Team<br/>
            Founder, Mercorama
          </p>
          <p style="font-size:12px;color:#94a3b8;margin:0;">
            Mercorama ·
            <a href="https://mercorama.com" style="color:#94a3b8;">mercorama.com</a>
          </p>
        </div>
      </div>
    `,
  });
}

// ── Payment failed email ───────────────────────────────────────────────────────

export async function sendPaymentFailedEmail({
  toEmail,
  fullName,
}: {
  toEmail:  string;
  fullName: string;
}) {
  if (!config.resendApiKey) return;
  const resend = new Resend(config.resendApiKey);

  await resend.emails.send({
    from:    config.resendFromEmail,
    to:      toEmail,
    subject: 'Action required: payment failed for your Mercorama subscription',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0f172a;padding:20px 24px;border-radius:8px 8px 0 0;">
          <p style="color:#fff;font-size:18px;font-weight:700;margin:0;">Mercorama</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:28px 24px;border-radius:0 0 8px 8px;">
          <p style="margin:0 0 16px;">Hi ${firstName(fullName)},</p>
          <p style="margin:0 0 16px;">
            We were unable to process your most recent payment.
            Please update your payment method to keep your subscription active.
          </p>
          <p style="margin:0 0 24px;">
            <a href="https://mercorama.com/dashboard"
               style="display:inline-block;background:#FF6100;color:#fff;font-weight:600;padding:12px 24px;border-radius:6px;text-decoration:none;">
              Update payment method →
            </a>
          </p>
          <p style="margin:0 0 16px;">
            If you need help, reply directly to this email.
          </p>
          <p style="margin:0 0 32px;">
            The Mercorama Team<br/>
            Founder, Mercorama
          </p>
          <p style="font-size:12px;color:#94a3b8;margin:0;">
            Mercorama ·
            <a href="https://mercorama.com" style="color:#94a3b8;">mercorama.com</a>
          </p>
        </div>
      </div>
    `,
  });
}
