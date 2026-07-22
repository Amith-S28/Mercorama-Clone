// app/api/admin/cohorts/waitlist/route.ts
// GET — waitlist table.  POST — notify selected waitlist members (Email 5).
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminAuth';
import { sendWaitlistCohortInvite } from '@/lib/betaEmails';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const p           = req.nextUrl.searchParams;
  const cohortTarget = p.get('cohort_target');
  const notified    = p.get('notified');   // 'yes' | 'no' | 'all'
  const converted   = p.get('converted');  // 'yes' | 'no' | 'all'

  const db = createServiceClient();
  let query = db.from('waitlist').select('*').order('created_at', { ascending: false });

  if (cohortTarget && cohortTarget !== 'all')
    query = query.eq('cohort_target', parseInt(cohortTarget));
  if (notified === 'yes') query = query.not('notified_at', 'is', null);
  if (notified === 'no')  query = query.is('notified_at', null);
  if (converted === 'yes') query = query.eq('converted', true);
  if (converted === 'no')  query = query.eq('converted', false);

  const { data } = await query;
  return NextResponse.json({ waitlist: data ?? [] });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ids, cohort_number } = await req.json() as {
    ids:           string[];   // specific waitlist IDs to notify
    cohort_number: number;     // cohort they're being invited to
  };

  if (!ids?.length || !cohort_number) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  const db = createServiceClient();

  // Get the cohort max_spots
  const { data: cohort } = await db
    .from('cohort_config')
    .select('max_spots')
    .eq('cohort_number', cohort_number)
    .maybeSingle();

  const maxSpots = cohort?.max_spots ?? 10;
  const now      = new Date().toISOString();

  // Fetch the waitlist entries
  const { data: entries } = await db
    .from('waitlist')
    .select('id, email, full_name, notified_at')
    .in('id', ids);

  let sent = 0;
  for (const entry of entries ?? []) {
    if (entry.notified_at) continue; // skip already notified
    await sendWaitlistCohortInvite({
      toEmail:      entry.email,
      fullName:     entry.full_name,
      cohortNumber: cohort_number,
      maxSpots,
    }).catch((e) => console.error('[waitlist/notify] Email error:', e));

    await db.from('waitlist').update({ notified_at: now }).eq('id', entry.id);
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
