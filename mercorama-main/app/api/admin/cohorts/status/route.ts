// app/api/admin/cohorts/status/route.ts
// PATCH — update cohort_status in cohort_config.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminAuth';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { cohort_number, cohort_status } = await req.json() as {
    cohort_number: number;
    cohort_status: string;
  };

  const VALID = ['open', 'reviewing', 'full', 'closed'];
  if (!VALID.includes(cohort_status)) {
    return NextResponse.json({ error: 'invalid_status' }, { status: 422 });
  }

  const db = createServiceClient();
  await db
    .from('cohort_config')
    .update({ cohort_status, updated_at: new Date().toISOString() })
    .eq('cohort_number', cohort_number);

  return NextResponse.json({ ok: true });
}
