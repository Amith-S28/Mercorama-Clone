// app/api/studio/availability/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

async function getExpertId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const db = createServiceClient();
  const { data } = await db.from('expert_profiles').select('id').eq('user_id', user.id).maybeSingle();
  return data?.id ?? null;
}

export async function GET() {
  const expertId = await getExpertId();
  if (!expertId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  const today = new Date().toISOString().split('T')[0];
  const { data } = await db
    .from('expert_availability_slots')
    .select('*')
    .eq('expert_id', expertId)
    .gte('slot_date', today)
    .order('slot_date')
    .order('start_time')
    .limit(200);

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const expertId = await getExpertId();
  if (!expertId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { slots } = body as { slots: { slot_date: string; start_time: string; end_time: string }[] };

  if (!slots || !Array.isArray(slots) || slots.length === 0) {
    return NextResponse.json({ error: 'No slots provided' }, { status: 400 });
  }

  const db = createServiceClient();
  const rows = slots.map((s) => ({
    expert_id: expertId,
    slot_date: s.slot_date,
    start_time: s.start_time,
    end_time: s.end_time,
    is_booked: false,
  }));

  const { error } = await db.from('expert_availability_slots').insert(rows);
  if (error) {
    console.error('[mercorama] studio availability create error:', error);
    return NextResponse.json({ error: 'Failed to create slots' }, { status: 500 });
  }

  return NextResponse.json({ created: rows.length }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const expertId = await getExpertId();
  if (!expertId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const db = createServiceClient();
  // Only delete unbooked slots
  await db.from('expert_availability_slots').delete().eq('id', id).eq('expert_id', expertId).eq('is_booked', false);
  return NextResponse.json({ success: true });
}
