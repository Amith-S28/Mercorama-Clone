// app/api/admin/data-flags/route.ts
// GET — list open flags. PATCH — update flag status + DT-7 affected-user notification.
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminAuth';
import { config } from '@/lib/config';

export const runtime = 'nodejs';

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  const { data, error } = await db
    .from('data_quality_flags')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: 'server_error' }, { status: 500 });
  return NextResponse.json({ flags: data ?? [] });
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

interface PatchBody {
  id:              string;
  status:          string;
  // DT-7 rate correction fields — only required when rate_correction = true
  rate_correction?: boolean;
  hs_code?:         string;
  old_value?:       string;
  new_value?:       string;
  source_name?:     string;
  affected_market?: string;
  market_id?:       string;
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as PatchBody;
  const { id, status } = body;
  if (!id || !status) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

  const db          = createServiceClient();
  const resolvedAt  = new Date().toISOString();

  // ── 1. Resolve the flag ────────────────────────────────────────────────────
  const flagUpdate: Record<string, unknown> = { status };
  if (status === 'resolved') {
    flagUpdate.resolved_at = resolvedAt;
    flagUpdate.resolved_by = admin.email;
  }

  const { error: updateError } = await db
    .from('data_quality_flags')
    .update(flagUpdate)
    .eq('id', id);

  if (updateError) return NextResponse.json({ error: 'server_error' }, { status: 500 });

  // ── 2. DT-7: notify affected users on rate correction ─────────────────────
  if (status === 'resolved' && body.rate_correction) {
    const hsCode         = body.hs_code ?? '';
    const marketId       = body.market_id ?? '';
    const thirtyDaysAgo  = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Query users who have used the affected HS code or market within 30 days.
    // Falls back gracefully if watchlist/recent_analyses columns don't exist yet —
    // Supabase returns an empty array rather than an error for missing CS matches.
    let affectedUsers: { id: string; email: string; full_name: string | null }[] = [];

    try {
      const orFilters = [
        hsCode   ? `watchlist_hs_codes.cs.{${hsCode}}`   : null,
        marketId ? `recent_analyses.cs.{${marketId}}`    : null,
      ].filter(Boolean).join(',');

      const query = db
        .from('users')
        .select('id, email, full_name')
        .eq('status', 'active');

      if (orFilters) query.or(orFilters);
      if (hsCode || marketId) query.gte('last_analysis_at', thirtyDaysAgo);

      const { data } = await query.limit(500);
      affectedUsers = data ?? [];
    } catch {
      // Column may not exist yet — skip notification silently
      affectedUsers = [];
    }

    // ── 3. Send Resend emails ───────────────────────────────────────────────
    const notifiedUserIds: string[] = [];

    if (affectedUsers.length > 0 && config.resendApiKey) {
      const resend       = new Resend(config.resendApiKey);
      const rerunUrl     = marketId
        ? `https://mercorama.com/dashboard?market=${encodeURIComponent(marketId)}&rerun=true`
        : 'https://mercorama.com/export-compass';

      const formattedDate = new Date(resolvedAt).toLocaleDateString('en-CA', {
        year: 'numeric', month: 'long', day: 'numeric',
      });

      await Promise.allSettled(
        affectedUsers.map(async (user) => {
          try {
            await resend.emails.send({
              from:    config.resendFromEmail,
              to:      user.email,
              subject: 'A tariff rate you track has been updated — Mercorama',
              html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 16px;color:#111;">
  <p style="margin-bottom:16px;">Hi ${user.full_name ?? 'there'},</p>
  <p style="margin-bottom:16px;">We corrected a data point you may have used in a recent analysis:</p>
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px;">
    <tbody>
      ${hsCode ? `<tr style="border-bottom:1px solid #eee;"><td style="padding:8px 12px;color:#666;width:40%;">HS Code</td><td style="padding:8px 12px;font-weight:600;">${hsCode}</td></tr>` : ''}
      ${body.old_value ? `<tr style="border-bottom:1px solid #eee;"><td style="padding:8px 12px;color:#666;">Previous rate</td><td style="padding:8px 12px;">${body.old_value}</td></tr>` : ''}
      ${body.new_value ? `<tr style="border-bottom:1px solid #eee;"><td style="padding:8px 12px;color:#666;">Corrected rate</td><td style="padding:8px 12px;font-weight:600;color:#16a34a;">${body.new_value}</td></tr>` : ''}
      ${body.source_name ? `<tr style="border-bottom:1px solid #eee;"><td style="padding:8px 12px;color:#666;">Source</td><td style="padding:8px 12px;">${body.source_name}</td></tr>` : ''}
      <tr><td style="padding:8px 12px;color:#666;">Updated</td><td style="padding:8px 12px;">${formattedDate}</td></tr>
    </tbody>
  </table>
  ${body.affected_market ? `<p style="margin-bottom:20px;">We recommend re-running your Export Compass analysis for <strong>${body.affected_market}</strong> to reflect this change.</p>` : ''}
  <a href="${rerunUrl}" style="display:inline-block;background:#FF6100;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;margin-bottom:24px;">
    Re-run Analysis →
  </a>
  <p style="color:#666;font-size:13px;">— The Mercorama Team</p>
</body>
</html>
              `.trim(),
            });
            notifiedUserIds.push(user.id);
          } catch (emailErr) {
            console.error(`[data-flags] Failed to notify user ${user.id}:`, emailErr);
          }
        })
      );
    }

    // ── 4. Log notified users to flag details ─────────────────────────────
    // Fetch existing details first, then merge patch
    const { data: flagRow } = await db
      .from('data_quality_flags')
      .select('details')
      .eq('id', id)
      .maybeSingle();

    const existingDetails = (flagRow?.details as Record<string, unknown>) ?? {};
    await db
      .from('data_quality_flags')
      .update({
        details: {
          ...existingDetails,
          notified_users: notifiedUserIds,
          notified_at:    resolvedAt,
        },
      })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      notified: notifiedUserIds.length,
    });
  }

  return NextResponse.json({ success: true });
}
