// app/api/admin/cohorts/application/route.ts
// POST — perform an admin action on a single beta_application.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminAuth';
import {
  sendDemoInvite,
  sendOfferEmail,
  sendRejectionEmail,
} from '@/lib/betaEmails';

export const runtime = 'nodejs';

// ── Access code generator ─────────────────────────────────────────────────────
function generateAccessCode(cohortNumber: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 6; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `MERC-C${cohortNumber}-${rand}`;
}

// ── Action body type ──────────────────────────────────────────────────────────
type ActionBody = {
  action:
    | 'send_demo_invite'
    | 'accept_direct'
    | 'send_offer'
    | 'reject'
    | 'waitlist_no_email'
    | 'mark_demo_complete'
    | 'resend_offer'
    | 'save_notes';
  id:                   string;
  calendly_link?:       string;
  admin_assigned_plan?: string;
  admin_note?:          string;
};

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as ActionBody;
  const { action, id } = body;
  if (!action || !id) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

  const db = createServiceClient();

  // Fetch application
  const { data: app } = await db
    .from('beta_applications')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!app) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const now = new Date().toISOString();

  switch (action) {

    // ── Send demo invite (Email 2A) ─────────────────────────────────────────
    case 'send_demo_invite': {
      if (!body.calendly_link) {
        return NextResponse.json({ error: 'calendly_link required' }, { status: 422 });
      }
      await db.from('beta_applications').update({
        status:        'demo_scheduled',
        reviewed_at:   now,
        reviewed_by:   admin.userId,
      }).eq('id', id);

      await sendDemoInvite({
        toEmail:      app.email,
        fullName:     app.full_name,
        cohortNumber: app.cohort_number,
        calendlyLink: body.calendly_link,
      });
      return NextResponse.json({ ok: true, status: 'demo_scheduled' });
    }

    // ── Accept direct + send offer (Email 2B, skip demo) ───────────────────
    case 'accept_direct':
    // ── Send offer after demo (Email 2B) ────────────────────────────────────
    case 'send_offer': {
      const plan = body.admin_assigned_plan ?? app.admin_assigned_plan ?? app.selected_plan;
      const code = generateAccessCode(app.cohort_number);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      await db.from('access_codes').insert({
        code,
        email:         app.email,
        cohort_number: app.cohort_number,
        selected_plan: plan,
        expires_at:    expiresAt,
        is_active:     true,
      });

      await db.from('beta_applications').update({
        status:             'accepted',
        admin_assigned_plan: plan,
        admin_note:         body.admin_note ?? app.admin_note,
        access_code:        code,
        offer_sent_at:      now,
        reviewed_at:        now,
        reviewed_by:        admin.userId,
      }).eq('id', id);

      await sendOfferEmail({
        toEmail:      app.email,
        fullName:     app.full_name,
        cohortNumber: app.cohort_number,
        plan,
        accessCode:   code,
        adminNote:    body.admin_note ?? app.admin_note,
        demoHeld:     app.demo_held_at != null,
      });
      return NextResponse.json({ ok: true, status: 'accepted', access_code: code });
    }

    // ── Resend offer email (same code) ──────────────────────────────────────
    case 'resend_offer': {
      const plan = app.admin_assigned_plan ?? app.selected_plan;
      if (!app.access_code) {
        return NextResponse.json({ error: 'no_access_code' }, { status: 422 });
      }
      await db.from('beta_applications').update({ offer_sent_at: now }).eq('id', id);

      await sendOfferEmail({
        toEmail:      app.email,
        fullName:     app.full_name,
        cohortNumber: app.cohort_number,
        plan,
        accessCode:   app.access_code,
        adminNote:    app.admin_note,
        demoHeld:     app.demo_held_at != null,
      });
      return NextResponse.json({ ok: true });
    }

    // ── Reject + send email (Email 3) ───────────────────────────────────────
    case 'reject': {
      await db.from('beta_applications').update({
        status:      'rejected',
        reviewed_at: now,
        reviewed_by: admin.userId,
      }).eq('id', id);

      // Add to waitlist if not already present
      const { data: existing } = await db
        .from('waitlist')
        .select('id')
        .eq('email', app.email)
        .maybeSingle();

      if (!existing) {
        await db.from('waitlist').insert({
          full_name:     app.full_name,
          email:         app.email,
          company_name:  app.company_name || null,
          province:      app.province || null,
          how_heard:     `Rejected — Cohort ${app.cohort_number}`,
          cohort_target: app.cohort_number + 1,
          converted:     false,
        });
      }

      await sendRejectionEmail({
        toEmail:      app.email,
        fullName:     app.full_name,
        cohortNumber: app.cohort_number,
      });
      return NextResponse.json({ ok: true, status: 'rejected' });
    }

    // ── Waitlist (no email) ─────────────────────────────────────────────────
    case 'waitlist_no_email': {
      await db.from('beta_applications').update({
        status:      'waitlisted',
        reviewed_at: now,
        reviewed_by: admin.userId,
      }).eq('id', id);

      const { data: existing } = await db
        .from('waitlist')
        .select('id')
        .eq('email', app.email)
        .maybeSingle();

      if (!existing) {
        await db.from('waitlist').insert({
          full_name:     app.full_name,
          email:         app.email,
          company_name:  app.company_name || null,
          province:      app.province || null,
          how_heard:     `Waitlisted — Cohort ${app.cohort_number}`,
          cohort_target: app.cohort_number + 1,
          converted:     false,
        });
      }
      return NextResponse.json({ ok: true, status: 'waitlisted' });
    }

    // ── Mark demo complete ──────────────────────────────────────────────────
    case 'mark_demo_complete': {
      await db.from('beta_applications').update({
        status:       'demo_complete',
        demo_held_at: now,
      }).eq('id', id);
      return NextResponse.json({ ok: true, status: 'demo_complete' });
    }

    // ── Save admin notes ────────────────────────────────────────────────────
    case 'save_notes': {
      await db.from('beta_applications').update({
        admin_notes:          body.admin_note ?? '',
        admin_assigned_plan:  body.admin_assigned_plan ?? app.admin_assigned_plan,
      }).eq('id', id);
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ error: 'unknown_action' }, { status: 400 });
  }
}
