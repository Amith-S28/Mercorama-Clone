// app/api/admin/cohorts/international/route.ts
// GET — international_waitlist rows for /admin/cohorts panel.
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminAuth';

export const runtime = 'nodejs';

export async function GET() {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();

  const { data, error } = await db
    .from('international_waitlist')
    .select('id, email, country, country_code, source, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('[admin/international] fetch error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  return NextResponse.json({ entries: data ?? [] });
}
