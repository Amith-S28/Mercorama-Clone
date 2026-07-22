// app/api/experts/collections/route.ts
// Public endpoint: returns all published collections with author info.
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
  const db = createServiceClient();
  const { data } = await db
    .from('expert_collections')
    .select('id, title, slug, summary, cover_image, created_at, expert_profiles!expert_collections_expert_id_fkey(headline, slug, avatar_url)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json(data ?? []);
}
