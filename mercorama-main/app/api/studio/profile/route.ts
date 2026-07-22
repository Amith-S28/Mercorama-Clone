// app/api/studio/profile/route.ts
// GET: returns the authenticated user's expert profile
// PUT: updates profile fields
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  const { data: profile } = await db
    .from('expert_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: 'No expert profile found' }, { status: 404 });

  // Also fetch joined data
  const [typesRes, verticalsRes, tagsRes, langsRes] = await Promise.all([
    db.from('expert_profile_types').select('type_id, expert_types(id, name, slug)').eq('expert_id', profile.id),
    db.from('expert_profile_verticals').select('vertical_id, expert_verticals(id, name, slug)').eq('expert_id', profile.id),
    db.from('expert_profile_tags').select('tag_id, expert_tags(id, name)').eq('expert_id', profile.id),
    db.from('expert_profile_languages').select('language_id, expert_languages(id, name)').eq('expert_id', profile.id),
  ]);

  return NextResponse.json({
    ...profile,
    types: (typesRes.data ?? []).map((r: Record<string, unknown>) => r.expert_types),
    verticals: (verticalsRes.data ?? []).map((r: Record<string, unknown>) => r.expert_verticals),
    tags: (tagsRes.data ?? []).map((r: Record<string, unknown>) => r.expert_tags),
    languages: (langsRes.data ?? []).map((r: Record<string, unknown>) => r.expert_languages),
  });
}

export async function PUT(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  const { data: profile } = await db
    .from('expert_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: 'No expert profile found' }, { status: 404 });

  const body = await req.json();
  const allowed = ['headline', 'bio', 'location', 'timezone', 'years_experience', 'linkedin_url', 'website_url', 'avatar_url'];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { error } = await db
    .from('expert_profiles')
    .update(update)
    .eq('id', profile.id);

  if (error) {
    console.error('[mercorama] studio profile update error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
