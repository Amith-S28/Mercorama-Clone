// app/api/studio/requests/route.ts — Expert's incoming consultation requests
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  const { data: profile } = await db.from('expert_profiles').select('id').eq('user_id', user.id).maybeSingle();
  if (!profile) return NextResponse.json({ error: 'Not an expert' }, { status: 403 });

  const { data: requests } = await db
    .from('expert_requests')
    .select('*')
    .eq('expert_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(100);

  return NextResponse.json(requests ?? []);
}
