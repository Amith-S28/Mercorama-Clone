// app/api/studio/services/route.ts
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
  const { data } = await db
    .from('expert_session_types')
    .select('*')
    .eq('expert_id', expertId)
    .order('sort_order');

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const expertId = await getExpertId();
  if (!expertId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const db = createServiceClient();

  const slug = (body.title ?? '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

  const { data, error } = await db
    .from('expert_session_types')
    .insert({
      expert_id: expertId,
      title: body.title,
      slug,
      duration_minutes: body.duration_minutes ?? 30,
      price_cents: body.price_cents ?? 0,
      currency: body.currency ?? 'CAD',
      description: body.description ?? '',
      sort_order: body.sort_order ?? 0,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[mercorama] studio service create error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const expertId = await getExpertId();
  if (!expertId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const db = createServiceClient();
  const update: Record<string, unknown> = {};
  for (const key of ['title', 'duration_minutes', 'price_cents', 'currency', 'description', 'is_active', 'sort_order']) {
    if (key in body) update[key] = body[key];
  }

  const { error } = await db
    .from('expert_session_types')
    .update(update)
    .eq('id', body.id)
    .eq('expert_id', expertId);

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const expertId = await getExpertId();
  if (!expertId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const db = createServiceClient();
  await db.from('expert_session_types').delete().eq('id', id).eq('expert_id', expertId);
  return NextResponse.json({ success: true });
}
