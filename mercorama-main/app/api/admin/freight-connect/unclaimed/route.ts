// app/api/admin/freight-connect/unclaimed/route.ts
// GET: unclaimed forwarders. POST: send claim invitation email(s).
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminAuth';
import { Resend } from 'resend';
import { config } from '@/lib/config';

export const runtime = 'nodejs';

const INVITE_SUBJECT = 'Your freight forwarding business is listed on Mercorama';

function inviteHtml(companyName: string, claimUrl: string) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#0f172a;padding:20px 24px;border-radius:8px 8px 0 0;">
        <p style="color:#fff;font-size:18px;font-weight:700;margin:0;">Mercorama Freight Connect</p>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
        <p>Hi <strong>${companyName}</strong>,</p>
        <p>
          Canadian SME exporters are searching for freight forwarders on
          <strong>Mercorama Freight Connect</strong> — and your company appears in our directory.
        </p>
        <p>
          <strong>Claim your listing</strong> to start receiving freight quote requests from
          vetted Canadian exporters, matched to your lanes, HS chapters, and shipping modes.
          Your identity stays private until you choose to connect — no cold calls, no spam.
        </p>
        <ul style="font-size:14px;color:#475569;line-height:1.8;">
          <li>Quote requests matched to your specialty lanes &amp; products</li>
          <li>48-hour response window — you stay in control</li>
          <li>CIFFA membership badge on your public listing</li>
          <li>Pay only for leads you receive (no subscription required to start)</li>
        </ul>
        <a href="${claimUrl}"
           style="display:inline-block;background:#0f172a;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:15px;margin-top:8px;">
          Claim Your Listing →
        </a>
        <p style="font-size:12px;color:#94a3b8;margin-top:24px;">
          Mercorama · <a href="https://mercorama.com" style="color:#94a3b8;">mercorama.com</a><br>
          Questions? <a href="mailto:support@mercorama.com" style="color:#94a3b8;">support@mercorama.com</a>
        </p>
      </div>
    </div>
  `;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();

  const { data: forwarders, error } = await db
    .from('freight_forwarders')
    .select('id, company_name, ciffa_membership_number, provinces, lanes, hs_chapters, shipping_modes, website_url, created_at')
    .eq('state', 'unclaimed')
    .order('company_name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Attach most recent invite date per forwarder
  const ids = (forwarders ?? []).map((f) => f.id);
  let lastInviteMap: Record<string, string> = {};

  if (ids.length > 0) {
    const { data: invites } = await db
      .from('forwarder_invite_log')
      .select('forwarder_id, sent_at')
      .in('forwarder_id', ids)
      .order('sent_at', { ascending: false });

    for (const inv of (invites ?? [])) {
      if (!lastInviteMap[inv.forwarder_id]) {
        lastInviteMap[inv.forwarder_id] = inv.sent_at;
      }
    }
  }

  const enriched = (forwarders ?? []).map((f) => ({
    ...f,
    last_invite_sent: lastInviteMap[f.id] ?? null,
  }));

  return NextResponse.json({ forwarders: enriched });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    forwarder_ids: string[];
  };

  const { forwarder_ids } = body;
  if (!forwarder_ids?.length) {
    return NextResponse.json({ error: 'forwarder_ids required' }, { status: 400 });
  }

  if (!config.resendApiKey) {
    return NextResponse.json({ error: 'Resend not configured' }, { status: 500 });
  }

  const db   = createServiceClient();
  const resend = new Resend(config.resendApiKey);

  const { data: forwarders } = await db
    .from('freight_forwarders')
    .select('id, company_name, primary_contact_email, website_url')
    .in('id', forwarder_ids)
    .eq('state', 'unclaimed');

  const sent: string[] = [];
  const errors: string[] = [];

  for (const ff of (forwarders ?? [])) {
    const email = ff.primary_contact_email;
    if (!email) {
      errors.push(`${ff.company_name}: no contact email on file`);
      continue;
    }

    const claimUrl = `https://mercorama.com/freight-connect/claim`;

    try {
      await resend.emails.send({
        from:    config.resendFromEmail,
        to:      email,
        subject: INVITE_SUBJECT,
        html:    inviteHtml(ff.company_name, claimUrl),
      });

      await db.from('forwarder_invite_log').insert({
        forwarder_id: ff.id,
        sent_by:      admin.email,
        email_to:     email,
      });

      sent.push(ff.id);
    } catch (e) {
      errors.push(`${ff.company_name}: ${String(e)}`);
    }
  }

  return NextResponse.json({ sent, errors });
}
