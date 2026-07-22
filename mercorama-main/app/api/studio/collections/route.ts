// app/api/studio/collections/route.ts
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
    .from('expert_collections')
    .select('*')
    .eq('expert_id', expertId)
    .order('created_at', { ascending: false });

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const expertId = await getExpertId();
  if (!expertId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const slug = (body.title ?? 'untitled')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

  const db = createServiceClient();
  const { data, error } = await db
    .from('expert_collections')
    .insert({
      expert_id: expertId,
      title: body.title ?? 'Untitled Guide',
      slug,
      summary: body.summary ?? '',
      content: body.content ?? '',
      is_published: false,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const expertId = await getExpertId();
  if (!expertId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const db = createServiceClient();
  const update: Record<string, unknown> = {};
  for (const key of ['title', 'summary', 'content', 'cover_image', 'is_published']) {
    if (key in body) update[key] = body[key];
  }

  const { error } = await db.from('expert_collections').update(update).eq('id', body.id).eq('expert_id', expertId);
  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const expertId = await getExpertId();
  if (!expertId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const db = createServiceClient();
  await db.from('expert_collections').delete().eq('id', id).eq('expert_id', expertId);
  return NextResponse.json({ success: true });
}
