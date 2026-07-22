// app/api/admin/cohorts/overview/route.ts
// GET — cohort config + metrics counts for /admin/cohorts.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminAuth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();

  const [
    { data: cohort },
    { data: apps },
    { count: waitlistCount },
    { count: intlCount },
  ] = await Promise.all([
    db.from('cohort_config').select('*').eq('cohort_number', 1).maybeSingle(),
    db.from('beta_applications').select('status, activated_at').eq('cohort_number', 1),
    db.from('waitlist').select('*', { count: 'exact', head: true }),
    db.from('international_waitlist').select('*', { count: 'exact', head: true }),
  ]);

  const appList = apps ?? [];
  const metrics = {
    total:          appList.length,
    pending:        appList.filter((a) => a.status === 'pending').length,
    demo_scheduled: appList.filter((a) => a.status === 'demo_scheduled').length,
    demo_complete:  appList.filter((a) => a.status === 'demo_complete').length,
    accepted:       appList.filter((a) => a.status === 'accepted').length,
    activated:      appList.filter((a) => a.activated_at != null).length,
    rejected:       appList.filter((a) => a.status === 'rejected').length,
    waitlisted:     appList.filter((a) => a.status === 'waitlisted').length,
    on_waitlist:         waitlistCount ?? 0,
    international_demand: intlCount ?? 0,
  };

  return NextResponse.json({ cohort, metrics });
}
