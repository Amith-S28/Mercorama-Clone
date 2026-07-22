// app/api/activate/validate/route.ts
// GET — validate an access code and return plan info.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'missing_code' }, { status: 400 });
  }

  const db = createServiceClient();

  const { data: record } = await db
    .from('access_codes')
    .select('code, email, cohort_number, selected_plan, expires_at, used_at, is_active')
    .eq('code', code)
    .maybeSingle();

  if (!record) {
    return NextResponse.json({ error: 'invalid_code' }, { status: 404 });
  }
  if (new Date(record.expires_at) < new Date()) {
    return NextResponse.json({ error: 'expired_code' }, { status: 410 });
  }
  if (record.used_at) {
    return NextResponse.json({ error: 'used_code' }, { status: 409 });
  }
  if (!record.is_active) {
    return NextResponse.json({ error: 'deactivated_code' }, { status: 403 });
  }

  // Verify the corresponding beta_application is still in 'accepted' status.
  // This prevents rejected or waitlisted applicants from using a code that was
  // issued to them before their status changed.
  const { data: application } = await db
    .from('beta_applications')
    .select('status')
    .eq('email', record.email.toLowerCase())
    .maybeSingle();

  if (!application || application.status !== 'accepted') {
    return NextResponse.json({ error: 'invalid_code' }, { status: 403 });
  }

  // Read plan pricing from plan_config
  const { data: plan } = await db
    .from('plan_config')
    .select('founding_price, public_price, price_lock_months')
    .eq('plan', record.selected_plan)
    .maybeSingle();

  return NextResponse.json({
    valid:           true,
    email:           record.email,
    cohort_number:   record.cohort_number,
    selected_plan:   record.selected_plan,
    founding_price:  plan?.founding_price ?? null,
    public_price:    plan?.public_price ?? null,
    price_lock_months: plan?.price_lock_months ?? 6,
  });
}
