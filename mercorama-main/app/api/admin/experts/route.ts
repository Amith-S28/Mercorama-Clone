// app/api/admin/experts/route.ts
// Admin CRUD for expert profiles — list, create, update, delete.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';
import { ADMIN_EMAILS } from '@/lib/admin';
import { provisionCalUser } from '@/lib/calcom';

export const runtime = 'nodejs';

async function checkAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}

// GET — list all expert profiles
export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = createServiceClient();
  const { data } = await db
    .from('expert_profiles')
    .select('*, expert_profile_types(expert_types(name, slug))')
    .order('created_at', { ascending: false });

  return NextResponse.json(data ?? []);
}

// POST — create new expert profile + optional Cal.com provisioning
export async function POST(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const db = createServiceClient();

  // Generate slug from headline
  const slug = (body.slug ?? body.headline ?? 'expert')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

  // Create expert profile
  const { data: profile, error } = await db
    .from('expert_profiles')
    .insert({
      slug,
      headline: body.headline ?? '',
      bio: body.bio ?? '',
      location: body.location ?? '',
      timezone: body.timezone ?? 'America/Toronto',
      years_experience: body.years_experience ?? 0,
      linkedin_url: body.linkedin_url ?? null,
      website_url: body.website_url ?? null,
      avatar_url: body.avatar_url ?? null,
      license_number: body.license_number ?? null,
      license_body: body.license_body ?? null,
      verification_tier: body.verification_tier ?? 3,
      is_approved: body.is_approved ?? false,
      is_active: true,
      user_id: body.user_id ?? null,
    })
    .select('id, slug, expert_code')
    .single();

  if (error || !profile) {
    console.error('[mercorama] admin create expert error:', error);
    return NextResponse.json({ error: error?.message ?? 'Failed to create' }, { status: 500 });
  }

  // Link expert types
  if (body.type_ids && Array.isArray(body.type_ids)) {
    const rows = body.type_ids.map((tid: string) => ({ expert_id: profile.id, type_id: tid }));
    await db.from('expert_profile_types').insert(rows);
  }

  // Link verticals
  if (body.vertical_ids && Array.isArray(body.vertical_ids)) {
    const rows = body.vertical_ids.map((vid: string) => ({ expert_id: profile.id, vertical_id: vid }));
    await db.from('expert_profile_verticals').insert(rows);
  }

  // Link languages
  if (body.language_ids && Array.isArray(body.language_ids)) {
    const rows = body.language_ids.map((lid: string) => ({ expert_id: profile.id, language_id: lid }));
    await db.from('expert_profile_languages').insert(rows);
  }

  // Link tags
  if (body.tag_ids && Array.isArray(body.tag_ids)) {
    const rows = body.tag_ids.map((tid: string) => ({ expert_id: profile.id, tag_id: tid }));
    await db.from('expert_profile_tags').insert(rows);
  }

  // Provision Cal.com user (best-effort)
  if (body.email) {
    const calUser = await provisionCalUser(body.email, body.headline ?? slug, slug);
    if (calUser) {
      await db.from('expert_profiles').update({
        cal_username: calUser.username,
        cal_user_id: calUser.calUserId,
      }).eq('id', profile.id);
    }
  }

  return NextResponse.json(profile, { status: 201 });
}

// PUT — update expert profile
export async function PUT(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const db = createServiceClient();
  const allowed = [
    'headline', 'bio', 'location', 'timezone', 'years_experience',
    'linkedin_url', 'website_url', 'avatar_url', 'license_number',
    'license_body', 'verification_tier', 'is_approved', 'is_active',
    'featured', 'user_id',
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const { error } = await db.from('expert_profiles').update(update).eq('id', body.id);
  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE — soft delete (set is_active = false)
export async function DELETE(req: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const db = createServiceClient();
  await db.from('expert_profiles').update({ is_active: false }).eq('id', id);
  return NextResponse.json({ success: true });
}
