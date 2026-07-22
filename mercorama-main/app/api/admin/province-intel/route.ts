// app/api/admin/province-intel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminAuth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  const url = new URL(req.url);
  const provinceCode = url.searchParams.get('province_code');
  const category = url.searchParams.get('category');

  // Single record lookup
  if (provinceCode && category) {
    const { data, error } = await db
      .from('province_intel')
      .select('*')
      .eq('province_code', provinceCode)
      .eq('category', category)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(data);
  }

  // List all
  const { data, error } = await db
    .from('province_intel')
    .select('id, province_code, category, key_insights, last_updated')
    .order('province_code')
    .order('category');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: provinces } = await db.from('canada_provinces').select('code, name');
  const nameMap = new Map((provinces ?? []).map((p: { code: string; name: string }) => [p.code, p.name]));

  const enriched = (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    province_name: nameMap.get(row.province_code as string) ?? row.province_code,
  }));

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { province_code, category } = body;

  if (!province_code || !category) {
    return NextResponse.json({ error: 'province_code and category required' }, { status: 400 });
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from('province_intel')
    .upsert({
      province_code,
      category,
      market_size: body.market_size ?? null,
      consumer_profile: body.consumer_profile ?? null,
      top_retail_chains: body.top_retail_chains ?? null,
      top_distributors: body.top_distributors ?? null,
      recommended_entry_channel: body.recommended_entry_channel ?? null,
      competition_intensity: body.competition_intensity ?? null,
      regulatory_notes: body.regulatory_notes ?? null,
      key_insights: body.key_insights ?? null,
      last_updated: new Date().toISOString(),
    }, { onConflict: 'province_code,category' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
