// app/api/experts/[slug]/availability/route.ts
// Returns available (unbooked) slots for an expert, from today forward.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const db = createServiceClient();

  // Get expert ID from slug
  const { data: expert } = await db
    .from('expert_profiles')
    .select('id')
    .eq('slug', slug)
    .eq('is_approved', true)
    .eq('is_active', true)
    .maybeSingle();

  if (!expert) {
    return NextResponse.json([], { status: 200 });
  }

  const today = new Date().toISOString().split('T')[0];

  const { data: slots } = await db
    .from('expert_availability_slots')
    .select('id, slot_date, start_time, end_time, is_booked')
    .eq('expert_id', expert.id)
    .eq('is_booked', false)
    .gte('slot_date', today)
    .order('slot_date')
    .order('start_time')
    .limit(200);

  return NextResponse.json(slots ?? []);
}
