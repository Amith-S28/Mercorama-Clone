// lib/freightConnectCron.ts
// 48hr SLA enforcement — runs every 15 minutes via cron
// Expires overdue quotes, issues Stripe refunds, suspends repeat-miss forwarders
import 'server-only';

import { Resend } from 'resend';
import { createServiceClient } from '@/lib/supabase';
import { suspendForwarder } from '@/lib/freightConnect';
import { config } from '@/lib/config';
import { stripe } from '@/lib/stripe';

const SUSPENSION_THRESHOLD = 3;

// ─── Result shape ─────────────────────────────────────────────────────────────

export interface SlaRunResult {
  run_at:                string;
  quotes_checked:        number;
  quotes_expired:        number;
  refunds_issued:        number;
  suspensions_triggered: number;
  errors:                string[];
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function runFreightConnectSlaCheck(): Promise<SlaRunResult> {
  const db       = createServiceClient();
  const resend   = new Resend(config.resendApiKey);
  const run_at   = new Date().toISOString();
  const errors:  string[] = [];

  let quotes_expired        = 0;
  let refunds_issued        = 0;
  let suspensions_triggered = 0;

  // ── Step 1: Expire overdue pending quotes via RPC ─────────────────────────
  const { data: expired, error: expireErr } = await db.rpc('expire_overdue_quotes');

  if (expireErr) {
    console.error('[FreightConnect SLA] expire_overdue_quotes RPC error:', expireErr);
    await logSlaRun(db, { run_at, quotes_checked: 0, quotes_expired: 0, refunds_issued: 0, suspensions_triggered: 0, error_message: expireErr.message });
    return { run_at, quotes_checked: 0, quotes_expired: 0, refunds_issued: 0, suspensions_triggered: 0, errors: [expireErr.message] };
  }

  const expiredRows = (expired ?? []) as Array<{
    expired_quote_id: string;
    forwarder_id_out: string;
    lead_was_charged: boolean;
  }>;

  quotes_expired = expiredRows.length;

  // ── Step 2: Process each expired quote ───────────────────────────────────
  for (const row of expiredRows) {
    // Issue Stripe refund for claimed forwarder charges
    if (row.lead_was_charged) {
      try {
        await issueLeadRefund(db, row.expired_quote_id, row.forwarder_id_out);
        refunds_issued++;
      } catch (e) {
        const msg = `Refund failed for quote ${row.expired_quote_id}: ${String(e)}`;
        errors.push(msg);
        console.error('[FreightConnect SLA]', msg);
      }
    }

    // Increment consecutive_missed_responses
    const { data: ff, error: ffErr } = await db
      .from('freight_forwarders')
      .update({ consecutive_missed_responses: db.rpc('increment_missed_responses' as never, { fwd_id: row.forwarder_id_out }) as never })
      .eq('id', row.forwarder_id_out)
      .select('consecutive_missed_responses, company_name, primary_contact_email, state')
      .single();

    // Fallback: manual increment if RPC not available
    if (ffErr || !ff) {
      await incrementMissedResponsesFallback(db, row.forwarder_id_out);
    }

    // Re-fetch updated count
    const { data: updated } = await db
      .from('freight_forwarders')
      .select('consecutive_missed_responses, company_name, primary_contact_email, state, is_suspended')
      .eq('id', row.forwarder_id_out)
      .single();

    if (!updated) continue;

    // Send missed-response warning email to forwarder
    if (updated.primary_contact_email) {
      await sendMissedResponseEmail(resend, {
        toEmail:      updated.primary_contact_email,
        companyName:  updated.company_name,
        missedCount:  updated.consecutive_missed_responses,
      }).catch((e) => errors.push(`Email failed for forwarder ${row.forwarder_id_out}: ${String(e)}`));
    }

    // Suspend if threshold reached
    if (
      updated.consecutive_missed_responses >= SUSPENSION_THRESHOLD &&
      !updated.is_suspended
    ) {
      try {
        await suspendForwarder(row.forwarder_id_out);
        suspensions_triggered++;

        // Suspension email to forwarder
        if (updated.primary_contact_email) {
          await sendSuspensionEmail(resend, {
            toEmail:     updated.primary_contact_email,
            companyName: updated.company_name,
          }).catch((e) => errors.push(`Suspension email failed: ${String(e)}`));
        }

        // Admin alert
        await sendAdminSuspensionAlert(resend, {
          forwarderId:  row.forwarder_id_out,
          companyName:  updated.company_name,
          missedCount:  updated.consecutive_missed_responses,
        }).catch((e) => errors.push(`Admin alert email failed: ${String(e)}`));
      } catch (e) {
        errors.push(`Suspension failed for ${row.forwarder_id_out}: ${String(e)}`);
      }
    }
  }

  // ── Step 3: Log run ───────────────────────────────────────────────────────
  await logSlaRun(db, {
    run_at,
    quotes_checked:        expiredRows.length,  // only overdue ones checked
    quotes_expired,
    refunds_issued,
    suspensions_triggered,
    error_message:         errors.length > 0 ? errors.slice(0, 3).join('; ') : null,
  });

  return {
    run_at,
    quotes_checked:        expiredRows.length,
    quotes_expired,
    refunds_issued,
    suspensions_triggered,
    errors,
  };
}

// ─── Stripe refund ────────────────────────────────────────────────────────────

async function issueLeadRefund(
  db: ReturnType<typeof createServiceClient>,
  quoteId: string,
  forwarderId: string
): Promise<void> {
  // Fetch the lead charge record
  const { data: charge } = await db
    .from('forwarder_lead_charges')
    .select('id, stripe_charge_id, amount')
    .eq('quote_request_id', quoteId)
    .eq('forwarder_id', forwarderId)
    .eq('refunded', false)
    .single();

  if (!charge?.stripe_charge_id) return; // no chargeable record

  const refund = await stripe.refunds.create({
    charge:            charge.stripe_charge_id,
    reason:            'requested_by_customer',
  });

  // Update charge record
  await db
    .from('forwarder_lead_charges')
    .update({
      refunded:        true,
      refunded_at:     new Date().toISOString(),
      stripe_refund_id: refund.id,
    })
    .eq('id', charge.id);

  // Update quote_requests.lead_refunded
  await db
    .from('quote_requests')
    .update({ lead_refunded: true, state: 'refunded' })
    .eq('id', quoteId);
}

// ─── Fallback: manual increment without RPC ───────────────────────────────────

async function incrementMissedResponsesFallback(
  db: ReturnType<typeof createServiceClient>,
  forwarderId: string
): Promise<void> {
  // Read then write (not atomic, but acceptable for low-traffic cron)
  const { data } = await db
    .from('freight_forwarders')
    .select('consecutive_missed_responses')
    .eq('id', forwarderId)
    .single();

  const current = (data?.consecutive_missed_responses as number) ?? 0;

  await db
    .from('freight_forwarders')
    .update({ consecutive_missed_responses: current + 1 })
    .eq('id', forwarderId);
}

// ─── Emails ───────────────────────────────────────────────────────────────────

async function sendMissedResponseEmail(
  resend: Resend,
  { toEmail, companyName, missedCount }: { toEmail: string; companyName: string; missedCount: number }
): Promise<void> {
  await resend.emails.send({
    from:    config.resendFromEmail,
    to:      toEmail,
    subject: `Action required: Missed quote response — Mercorama Freight Connect`,
    html: `
      <p>Hi ${companyName},</p>
      <p>A quote request on <strong>Mercorama Freight Connect</strong> was not responded to within your 48-hour SLA window and has now expired.</p>
      <p><strong>Missed responses this period: ${missedCount} / ${SUSPENSION_THRESHOLD}</strong></p>
      <p>If you reach ${SUSPENSION_THRESHOLD} consecutive missed responses, your listing will be suspended and removed from search results.</p>
      <p>To avoid suspension, please log in to your forwarder dashboard and respond to open quote requests promptly.</p>
      <p>
        <a href="https://mercorama.com/dashboard/freight-connect" style="background:#0f172a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">
          View Quote Inbox →
        </a>
      </p>
      <p style="font-size:12px;color:#666;">Mercorama Freight Connect · <a href="https://mercorama.com">mercorama.com</a></p>
    `,
  });
}

async function sendSuspensionEmail(
  resend: Resend,
  { toEmail, companyName }: { toEmail: string; companyName: string }
): Promise<void> {
  await resend.emails.send({
    from:    config.resendFromEmail,
    to:      toEmail,
    subject: `Your Freight Connect listing has been suspended`,
    html: `
      <p>Hi ${companyName},</p>
      <p>Your listing on <strong>Mercorama Freight Connect</strong> has been <strong>suspended</strong> due to ${SUSPENSION_THRESHOLD} consecutive missed quote responses.</p>
      <p>Your profile has been removed from search results. Existing subscription charges have been paused.</p>
      <p>To reinstate your listing, please contact our support team at <a href="mailto:support@mercorama.com">support@mercorama.com</a> with a commitment to meeting SLA requirements.</p>
      <p style="font-size:12px;color:#666;">Mercorama Freight Connect · <a href="https://mercorama.com">mercorama.com</a></p>
    `,
  });
}

async function sendAdminSuspensionAlert(
  resend: Resend,
  { forwarderId, companyName, missedCount }: { forwarderId: string; companyName: string; missedCount: number }
): Promise<void> {
  await resend.emails.send({
    from:    config.resendFromEmail,
    to:      'admin@mercorama.com',
    subject: `[Admin] Forwarder suspended: ${companyName}`,
    html: `
      <p><strong>Forwarder suspended on Freight Connect</strong></p>
      <ul>
        <li>Company: ${companyName}</li>
        <li>ID: ${forwarderId}</li>
        <li>Missed responses: ${missedCount}</li>
        <li>Suspended at: ${new Date().toISOString()}</li>
      </ul>
      <p>
        <a href="https://mercorama.com/admin/freight-connect?id=${forwarderId}">
          Review in Admin Panel →
        </a>
      </p>
    `,
  });
}

// ─── Logging ──────────────────────────────────────────────────────────────────

async function logSlaRun(
  db: ReturnType<typeof createServiceClient>,
  entry: {
    run_at:                string;
    quotes_checked:        number;
    quotes_expired:        number;
    refunds_issued:        number;
    suspensions_triggered: number;
    error_message:         string | null;
  }
): Promise<void> {
  const { error } = await db.from('freight_connect_sla_log').insert(entry);
  if (error) {
    console.error('[FreightConnect SLA] Failed to write SLA log:', error);
  }
}
