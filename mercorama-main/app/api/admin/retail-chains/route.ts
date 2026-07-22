// app/api/admin/retail-chains/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminAuth';

export const runtime = 'nodejs';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  const { data, error } = await db.from('canada_retail_chains').select('*').order('tier').order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, name, tier, category, province_codes, store_count, website, notes } = body;
  if (!name || !tier) return NextResponse.json({ error: 'name and tier required' }, { status: 400 });

  const db = createServiceClient();
  const record = { name, tier, category: category ?? null, province_codes: province_codes ?? [], store_count: store_count ?? null, website: website ?? null, notes: notes ?? null, last_updated: new Date().toISOString() };

  if (id) {
    const { data, error } = await db.from('canada_retail_chains').update(record).eq('id', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const { data, error } = await db.from('canada_retail_chains').insert(record).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const db = createServiceClient();
  const { error } = await db.from('canada_retail_chains').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
