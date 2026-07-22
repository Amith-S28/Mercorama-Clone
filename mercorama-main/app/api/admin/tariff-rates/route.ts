// app/api/admin/tariff-rates/route.ts
// Admin CRUD for verified_tariff_rates table.
// GET  → list rates (filterable by country, hs_code)
// POST → upsert a rate
// DELETE → remove a rate by hs_code + country_iso2

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { ADMIN_EMAILS } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';

async function requireAdmin(req: NextRequest): Promise<string | null> {
  // Service-role internal calls bypass auth check
  if (req.headers.get('x-service-role') === process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  // Otherwise verify session user is an admin
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const email = user?.email?.toLowerCase() ?? '';
    if (!email || !ADMIN_EMAILS.includes(email)) return 'Unauthorized';
  } catch {
    return 'Unauthorized';
  }
  return null;
}

export async function GET(req: NextRequest) {
  const authErr = await requireAdmin(req);
  if (authErr) return NextResponse.json({ error: authErr }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const country = searchParams.get('country');
  const hsCode  = searchParams.get('hs_code');
  const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit   = 50;
  const offset  = (page - 1) * limit;

  const supabase = createServiceClient();
  let query = supabase
    .from('verified_tariff_rates')
    .select('*', { count: 'exact' })
    .order('country_iso2', { ascending: true })
    .order('hs_code', { ascending: true })
    .range(offset, offset + limit - 1);

  if (country) query = query.eq('country_iso2', country.toUpperCase());
  if (hsCode)  query = query.ilike('hs_code', `${hsCode.replace(/\./g, '').slice(0, 6)}%`);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ rates: data, total: count ?? 0, page, limit });
}

export async function POST(req: NextRequest) {
  const authErr = await requireAdmin(req);
  if (authErr) return NextResponse.json({ error: authErr }, { status: 401 });

  let body: {
    hs_code: string;
    country_iso2: string;
    mfn_rate: string;
    preferential_rate?: string;
    fta_name?: string;
    source: string;
    verified?: boolean;
    notes?: string;
  };

  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { hs_code, country_iso2, mfn_rate, source } = body;
  if (!hs_code || !country_iso2 || !mfn_rate || !source) {
    return NextResponse.json({ error: 'hs_code, country_iso2, mfn_rate, source are required' }, { status: 400 });
  }

  const normalized = hs_code.replace(/[\s.]/g, '').slice(0, 6);
  if (!/^\d{6}$/.test(normalized)) {
    return NextResponse.json({ error: 'hs_code must be a 6-digit number' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('verified_tariff_rates')
    .upsert(
      {
        hs_code:           normalized,
        country_iso2:      country_iso2.toUpperCase(),
        mfn_rate,
        preferential_rate: body.preferential_rate ?? null,
        fta_name:          body.fta_name ?? null,
        source,
        verified:          body.verified ?? false,
        notes:             body.notes ?? null,
        verified_date:     new Date().toISOString().slice(0, 10),
      },
      { onConflict: 'hs_code,country_iso2' },
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rate: data });
}

export async function DELETE(req: NextRequest) {
  const authErr = await requireAdmin(req);
  if (authErr) return NextResponse.json({ error: authErr }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const hsCode     = searchParams.get('hs_code');
  const countryIso = searchParams.get('country_iso2');

  if (!hsCode || !countryIso) {
    return NextResponse.json({ error: 'hs_code and country_iso2 required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('verified_tariff_rates')
    .delete()
    .eq('hs_code', hsCode.replace(/\./g, '').slice(0, 6))
    .eq('country_iso2', countryIso.toUpperCase());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
