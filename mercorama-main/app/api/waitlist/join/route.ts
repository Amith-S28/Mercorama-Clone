// app/api/waitlist/join/route.ts
// POST — add email to Cohort 2+ waitlist.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { sendWaitlistConfirmation } from '@/lib/betaEmails';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    full_name:    string;
    email:        string;
    company_name?: string;
    province?:    string;
    how_heard?:   string;
  };

  // ── Validate required fields ──────────────────────────────────────────────
  const fieldErrors: Record<string, string> = {};
  if (!body.full_name?.trim()) fieldErrors.full_name = 'This field is required.';
  if (!body.email?.trim())     fieldErrors.email     = 'This field is required.';
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    fieldErrors.email = 'Enter a valid email address.';
  }
  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json(
      { error: 'validation_error', fields: fieldErrors },
      { status: 422 }
    );
  }

  const db = createServiceClient();
  const email = body.email.toLowerCase().trim();

  // ── Check duplicate waitlist ──────────────────────────────────────────────
  const { data: existingWaitlist } = await db
    .from('waitlist')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingWaitlist) {
    return NextResponse.json(
      { error: 'duplicate_waitlist', message: "You're already on the waitlist. We'll notify you when Cohort 2 opens." },
      { status: 409 }
    );
  }

  // ── Check if already applied to Cohort 1 ─────────────────────────────────
  const { data: existingApp } = await db
    .from('beta_applications')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingApp) {
    return NextResponse.json(
      { error: 'already_applied', message: "You've already applied for Cohort 1. We'll be in touch within 48 hours." },
      { status: 409 }
    );
  }

  // ── Insert into waitlist ──────────────────────────────────────────────────
  const { error: insertError } = await db
    .from('waitlist')
    .insert({
      full_name:     body.full_name.trim(),
      email,
      company_name:  body.company_name?.trim() || null,
      province:      body.province || null,
      how_heard:     body.how_heard?.trim() || null,
      cohort_target: 2,
      converted:     false,
    });

  if (insertError) {
    console.error('[waitlist/join] Insert error:', insertError);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  // ── Send confirmation email (fire-and-forget) ─────────────────────────────
  void sendWaitlistConfirmation({
    toEmail:  email,
    fullName: body.full_name.trim(),
  }).catch((e) => console.error('[waitlist/join] Email error:', e));

  return NextResponse.json({ success: true }, { status: 201 });
}
