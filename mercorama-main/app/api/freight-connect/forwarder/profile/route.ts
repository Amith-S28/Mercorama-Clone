// app/api/freight-connect/forwarder/profile/route.ts
// GET: full profile + testimonials. PUT: update profile fields + testimonials.
import { NextRequest, NextResponse } from 'next/server';
import { supabase, createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = createServiceClient();
    const { data: ff } = await db
      .from('freight_forwarders')
      .select('*')
      .eq('primary_contact_email', user.email)
      .maybeSingle();

    if (!ff) return NextResponse.json({ error: 'no_forwarder_found' }, { status: 404 });

    const { data: testimonials } = await db
      .from('forwarder_testimonials')
      .select('*')
      .eq('forwarder_id', ff.id)
      .order('created_at');

    return NextResponse.json({ forwarder: ff, testimonials: testimonials ?? [] });

  } catch (err) {
    console.error('[FC forwarder/profile GET] error:', err);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = createServiceClient();
    const { data: ff } = await db
      .from('freight_forwarders')
      .select('id, state, subscription_tier')
      .eq('primary_contact_email', user.email)
      .maybeSingle();

    if (!ff) return NextResponse.json({ error: 'no_forwarder_found' }, { status: 404 });

    const body = await req.json() as {
      website_url?:      string;
      description?:      string;
      logo_url?:         string;
      provinces?:        string[];
      lanes?:            string[];
      hs_chapters?:      string[];
      shipping_modes?:   string[];
      primary_contact_name?: string;
      // Testimonials (verified/featured only) — full replace
      testimonials?: Array<{ author_name: string; author_company: string; body: string }>;
    };

    const { testimonials, ...profileFields } = body;

    // Strip undefined keys
    const updates: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(profileFields)) {
      if (v !== undefined) updates[k] = v;
    }

    if (Object.keys(updates).length > 0) {
      await db.from('freight_forwarders').update(updates).eq('id', ff.id);
    }

    // Testimonials — verified/featured only, max 3 per spec
    const isSubscribed = ff.subscription_tier === 'verified' || ff.subscription_tier === 'featured';
    if (testimonials !== undefined && isSubscribed) {
      const MAX = ff.subscription_tier === 'featured' ? 10 : 3;
      const capped = testimonials.slice(0, MAX);

      // Full replace: delete existing, insert new
      await db.from('forwarder_testimonials').delete().eq('forwarder_id', ff.id);

      if (capped.length > 0) {
        await db.from('forwarder_testimonials').insert(
          capped.map((t) => ({ ...t, forwarder_id: ff.id }))
        );
      }
    }

    return NextResponse.json({ updated: true });

  } catch (err) {
    console.error('[FC forwarder/profile PUT] error:', err);
    return NextResponse.json({ error: 'Profile update failed' }, { status: 500 });
  }
}
