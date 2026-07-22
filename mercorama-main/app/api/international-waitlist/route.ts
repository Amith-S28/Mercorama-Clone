// app/api/international-waitlist/route.ts
// Captures non-Canadian users who hit the geo-block on /activate or /waitlist.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: { email?: string; country?: string; country_code?: string; source?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }

  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  const db = createServiceClient();

  const { error } = await db.from('international_waitlist').insert({
    email,
    country:      body.country     ?? null,
    country_code: body.country_code ?? null,
    detected_at:  new Date().toISOString(),
    source:       body.source ?? 'unknown',
  });

  if (error) {
    if (error.code === '23505') {
      // Duplicate — already registered
      return NextResponse.json({ success: true, duplicate: true });
    }
    console.error('[international-waitlist] insert error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
