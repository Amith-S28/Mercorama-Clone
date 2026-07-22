// app/api/admin/experts/sessions/route.ts
// Admin CRUD for any expert's session types.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';
import { ADMIN_EMAILS } from '@/lib/admin';

export const runtime = 'nodejs';

async function checkAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}

// GET — list sessions for a specific expert
export async function GET(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const expertId = req.nextUrl.searchParams.get('expert_id');
  if (!expertId) return NextResponse.json({ error: 'expert_id required' }, { status: 400 });

  const db = createServiceClient();
  const { data } = await db
    .from('expert_session_types')
    .select('*')
    .eq('expert_id', expertId)
    .order('sort_order');

  return NextResponse.json(data ?? []);
}

// POST — create session for any expert
export async function POST(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  if (!body.expert_id) return NextResponse.json({ error: 'expert_id required' }, { status: 400 });

  const slug = (body.title ?? 'session')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

  const db = createServiceClient();
  const { data, error } = await db
    .from('expert_session_types')
    .insert({
      expert_id: body.expert_id,
      title: body.title ?? 'New Session',
      slug,
      duration_minutes: body.duration_minutes ?? 30,
      price_cents: body.price_cents ?? 0,
      currency: body.currency ?? 'CAD',
      description: body.description ?? '',
      sort_order: body.sort_order ?? 0,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PUT — update session
export async function PUT(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const db = createServiceClient();
  const update: Record<string, unknown> = {};
  for (const key of ['title', 'duration_minutes', 'price_cents', 'currency', 'description', 'is_active', 'sort_order']) {
    if (key in body) update[key] = body[key];
  }

  const { error } = await db.from('expert_session_types').update(update).eq('id', body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE — remove session
export async function DELETE(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const db = createServiceClient();
  await db.from('expert_session_types').delete().eq('id', id);
  return NextResponse.json({ success: true });
}
