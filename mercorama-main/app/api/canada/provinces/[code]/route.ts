// app/api/canada/provinces/[code]/route.ts
// GET: Returns full deep dive data for a single province.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const upperCode = code.toUpperCase();
  const db = createServiceClient();

  const [
    { data: province, error: pErr },
    { data: chains, error: cErr },
    { data: distributors, error: dErr },
    { data: intel, error: iErr },
  ] = await Promise.all([
    db.from('canada_provinces').select('*').eq('code', upperCode).maybeSingle(),
    db.from('canada_retail_chains').select('*').order('tier').order('name'),
    db.from('canada_distributors').select('*').order('name'),
    db.from('province_intel').select('*').eq('province_code', upperCode),
  ]);

  if (pErr) {
    console.error('[mercorama] canada/provinces/[code] error:', pErr);
    return NextResponse.json({ error: 'Failed to load province data' }, { status: 500 });
  }

  if (!province) {
    return NextResponse.json({ error: 'Province not found' }, { status: 404 });
  }

  const provinceChains = (chains ?? []).filter(
    (c: Record<string, unknown>) => Array.isArray(c.province_codes) && (c.province_codes as string[]).includes(upperCode),
  );
  const provinceDistributors = (distributors ?? []).filter(
    (d: Record<string, unknown>) => Array.isArray(d.province_codes) && (d.province_codes as string[]).includes(upperCode),
  );

  return NextResponse.json({
    ...province,
    retail_chains: provinceChains,
    distributors: provinceDistributors,
    intelligence: intel ?? [],
  });
}
