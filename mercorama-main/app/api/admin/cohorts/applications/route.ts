// app/api/admin/cohorts/applications/route.ts
// GET — all beta_applications with optional filters.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminAuth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const p        = req.nextUrl.searchParams;
  const status   = p.get('status');
  const plan     = p.get('plan');
  const province = p.get('province');
  const cohort   = p.get('cohort');
  const search   = p.get('search');

  const db = createServiceClient();
  let query = db
    .from('beta_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (status && status !== 'all')   query = query.eq('status', status);
  if (plan   && plan !== 'all')     query = query.eq('selected_plan', plan);
  if (province && province !== 'all') query = query.eq('province', province);
  if (cohort && cohort !== 'all')   query = query.eq('cohort_number', parseInt(cohort));
  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error('[cohorts/applications] Query error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  return NextResponse.json({ applications: data ?? [] });
}
