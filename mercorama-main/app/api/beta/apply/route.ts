// app/api/beta/apply/route.ts
// POST — submit a beta cohort application.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { sendBetaApplicationConfirmation } from '@/lib/betaEmails';

export const runtime = 'nodejs';

// ── In-memory rate limiter (5 submissions / IP / hour) ───────────────────────
// This is a lightweight, single-process guard. For multi-instance deployments,
// replace with @upstash/ratelimit backed by Redis.
const ipSubmitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_MAX      = 5;
const RATE_LIMIT_WINDOW   = 60 * 60 * 1000; // 1 hour in ms

function isRateLimited(ip: string): boolean {
  const now    = Date.now();
  const entry  = ipSubmitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    ipSubmitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  entry.count += 1;
  return false;
}

const REQUIRED = [
  'full_name', 'email', 'company_name', 'province',
  'product_description', 'export_experience',
  'biggest_challenge', 'selected_plan',
] as const;

type Body = {
  full_name:           string;
  email:               string;
  company_name:        string;
  province:            string;
  website?:            string;
  product_description: string;
  hs_code?:            string;
  export_experience:   string;
  biggest_challenge:   string;
  selected_plan:       string;
  referral_source?:    string;
  linkedin_url?:       string;
};

export async function POST(req: NextRequest) {
  // ── Rate limiting ────────────────────────────────────────────────────────────
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      { status: 429 }
    );
  }

  const body = await req.json() as Body;

  // ── Validate required fields ────────────────────────────────────────────────
  const fieldErrors: Record<string, string> = {};
  for (const field of REQUIRED) {
    if (!body[field]?.trim()) {
      fieldErrors[field] = 'This field is required.';
    }
  }
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

  // ── Cohort check + insert via RPC (atomic, prevents race condition) ─────────
  // The Supabase RPC `submit_beta_application` must:
  //   1. Lock cohort_config row with SELECT ... FOR UPDATE
  //   2. Check cohort_status = 'open', else raise exception 'cohort_closed'
  //   3. Check no existing row in beta_applications with this email,
  //      else raise exception 'duplicate_email'
  //   4. Insert the application row and return the new id
  //
  // SQL definition (run once in Supabase SQL editor):
  //   See /supabase/migrations/submit_beta_application.sql
  //
  // Until the RPC is deployed, the code below falls back to the two-step
  // approach (non-atomic) and logs a warning.
  const email = body.email.toLowerCase().trim();

  const { data: rpcResult, error: rpcError } = await db.rpc(
    'submit_beta_application',
    {
      p_full_name:           body.full_name.trim(),
      p_email:               email,
      p_company_name:        body.company_name.trim(),
      p_province:            body.province,
      p_website:             body.website?.trim() || null,
      p_product_description: body.product_description.trim(),
      p_hs_code:             body.hs_code?.trim() || null,
      p_export_experience:   body.export_experience,
      p_biggest_challenge:   body.biggest_challenge,
      p_selected_plan:       body.selected_plan,
      p_referral_source:     body.referral_source?.trim() || null,
      p_linkedin_url:        body.linkedin_url?.trim() || null,
      p_cohort_number:       1,
    }
  );

  // If the RPC doesn't exist yet, fall back to non-atomic path with a warning
  if (rpcError && rpcError.code === 'PGRST202') {
    console.warn('[beta/apply] RPC submit_beta_application not found — falling back to non-atomic path. Deploy /supabase/migrations/submit_beta_application.sql to fix.');

    // ── Re-verify cohort is still open ───────────────────────────────────────
    const { data: cohort } = await db
      .from('cohort_config')
      .select('cohort_status')
      .eq('cohort_number', 1)
      .maybeSingle();

    if (!cohort || cohort.cohort_status !== 'open') {
      return NextResponse.json(
        { error: 'cohort_closed', message: 'Applications are no longer open.' },
        { status: 403 }
      );
    }

    // ── Check for duplicate email ─────────────────────────────────────────────
    const { data: existing } = await db
      .from('beta_applications')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'duplicate_email', message: "You've already applied with this email. We'll be in touch within 48 hours." },
        { status: 409 }
      );
    }

    // ── Mark waitlist as converted if present ─────────────────────────────────
    await db.from('waitlist').update({ converted: true }).eq('email', email);

    // ── Insert application ────────────────────────────────────────────────────
    const { error: insertError } = await db
      .from('beta_applications')
      .insert({
        full_name:              body.full_name.trim(),
        email,
        company_name:           body.company_name.trim(),
        province:               body.province,
        website:                body.website?.trim() || null,
        product_description:    body.product_description.trim(),
        hs_code:                body.hs_code?.trim() || null,
        export_experience:      body.export_experience,
        biggest_challenge:      body.biggest_challenge,
        selected_plan:          body.selected_plan,
        original_plan_selected: body.selected_plan,
        referral_source:        body.referral_source?.trim() || null,
        linkedin_url:           body.linkedin_url?.trim() || null,
        cohort_number:          1,
        status:                 'pending',
      });

    if (insertError) {
      console.error('[beta/apply] Insert error:', insertError);
      return NextResponse.json({ error: 'server_error' }, { status: 500 });
    }

  } else if (rpcError) {
    // RPC exists but returned a business-logic error
    if (rpcError.message?.includes('cohort_closed')) {
      return NextResponse.json(
        { error: 'cohort_closed', message: 'Applications are no longer open.' },
        { status: 403 }
      );
    }
    if (rpcError.message?.includes('duplicate_email')) {
      return NextResponse.json(
        { error: 'duplicate_email', message: "You've already applied with this email. We'll be in touch within 48 hours." },
        { status: 409 }
      );
    }
    console.error('[beta/apply] RPC error:', rpcError);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  void rpcResult; // suppress unused warning — RPC returns the new row id

  // ── Send confirmation email (fire-and-forget) ──────────────────────────────
  void sendBetaApplicationConfirmation({
    toEmail:      body.email.toLowerCase().trim(),
    fullName:     body.full_name.trim(),
    selectedPlan: body.selected_plan,
  }).catch((e) => console.error('[beta/apply] Email error:', e));

  return NextResponse.json({ success: true }, { status: 201 });
}
