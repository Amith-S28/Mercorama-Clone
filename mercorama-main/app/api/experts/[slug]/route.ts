// app/api/experts/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getExpertBySlug } from '@/lib/experts';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!slug) return NextResponse.json({ error: 'Slug required' }, { status: 400 });

  try {
    const expert = await getExpertBySlug(slug);
    if (!expert) return NextResponse.json({ error: 'Expert not found' }, { status: 404 });
    return NextResponse.json(expert);
  } catch (err) {
    console.error('[mercorama] expert profile error:', err);
    return NextResponse.json({ error: 'Failed to load expert' }, { status: 500 });
  }
}
