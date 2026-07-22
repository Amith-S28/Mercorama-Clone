// app/api/snapshot/route.ts
// Business Snapshot — upsert to Supabase user_snapshots table.
//
// Migration (run in Supabase SQL editor):
// create table if not exists user_snapshots (
//   id uuid primary key default gen_random_uuid(),
//   user_id uuid references auth.users(id) on delete cascade not null,
//   product_description text not null,
//   price_range text not null,
//   current_market text not null,
//   export_experience text not null,
//   created_at timestamptz default now(),
//   updated_at timestamptz default now(),
//   unique(user_id)
// );
// alter table user_snapshots enable row level security;

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// GET — fetch existing snapshot for current user
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  const { data } = await db
    .from('user_snapshots')
    .select('product_description, price_range, current_market, export_experience, growth_intent')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!data) return NextResponse.json(null);

  return NextResponse.json({
    productDescription: data.product_description,
    priceRange: data.price_range,
    currentMarket: data.current_market,
    exportExperience: data.export_experience,
    growthIntent: data.growth_intent ?? '',
  });
}

// POST — upsert snapshot
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { productDescription, priceRange, currentMarket, exportExperience, growthIntent } = body;

  if (!productDescription?.trim() || !priceRange || !currentMarket || !exportExperience) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  const db = createServiceClient();
  const { error } = await db
    .from('user_snapshots')
    .upsert({
      user_id: user.id,
      product_description: productDescription.trim(),
      price_range: priceRange,
      current_market: currentMarket,
      export_experience: exportExperience,
      growth_intent: growthIntent ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) {
    console.error('[mercorama] snapshot upsert error:', error);
    return NextResponse.json({ error: 'Failed to save snapshot' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
