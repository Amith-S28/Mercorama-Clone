// app/api/canada/provinces/route.ts
// GET: Returns all provinces with top retail chains + distributors.
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
  const db = createServiceClient();

  const [
    { data: provinces, error: pErr },
    { data: chains, error: cErr },
    { data: distributors, error: dErr },
  ] = await Promise.all([
    db.from('canada_provinces').select('*').order('name'),
    db.from('canada_retail_chains').select('*').order('tier').order('name'),
    db.from('canada_distributors').select('*').order('name'),
  ]);

  if (pErr || cErr || dErr) {
    console.error('[mercorama] canada/provinces error:', pErr ?? cErr ?? dErr);
    return NextResponse.json({ error: 'Failed to load province data' }, { status: 500 });
  }

  const result = (provinces ?? []).map((p: Record<string, unknown>) => {
    const code = p.code as string;
    const provinceChains = (chains ?? []).filter(
      (c: Record<string, unknown>) => Array.isArray(c.province_codes) && (c.province_codes as string[]).includes(code),
    );
    const provinceDistributors = (distributors ?? []).filter(
      (d: Record<string, unknown>) => Array.isArray(d.province_codes) && (d.province_codes as string[]).includes(code),
    );

    return {
      ...p,
      retail_chains: provinceChains.slice(0, 4),
      distributors: provinceDistributors.slice(0, 3),
    };
  });

  return NextResponse.json(result);
}
