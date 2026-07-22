// app/api/experts/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { searchExperts, type ExpertSearchFilters } from '@/lib/experts';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const filters: ExpertSearchFilters = {
    type: sp.get('type') ?? undefined,
    vertical: sp.get('vertical') ?? undefined,
    language: sp.get('language') ?? undefined,
    sort: (sp.get('sort') as ExpertSearchFilters['sort']) ?? 'featured',
    q: sp.get('q') ?? undefined,
  };

  try {
    const result = await searchExperts(filters);
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    });
  } catch (err) {
    console.error('[mercorama] expert search error:', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
