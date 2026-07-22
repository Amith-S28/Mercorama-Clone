// app/api/beta/status/route.ts
// Public endpoint — returns live cohort status + plan prices.
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
  const db = createServiceClient();

  const [{ data: cohort }, { data: plans }] = await Promise.all([
    db.from('cohort_config').select('*').eq('cohort_number', 1).maybeSingle(),
    db.from('plan_config').select('*').eq('is_active', true),
  ]);

  return NextResponse.json({ cohort, plans: plans ?? [] });
}
