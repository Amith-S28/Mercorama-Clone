// app/api/geo/route.ts
// Lightweight server-side IP geolocation via ipapi.co.
// Returns { country_code: 'CA' | string | null }.
// Fails open (returns 'CA') so a geo API outage never blocks a Canadian user.
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? '127.0.0.1';

  // Localhost / dev — treat as CA so the flow works in development
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return NextResponse.json({ country_code: 'CA' });
  }

  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { 'User-Agent': 'mercorama/1.0' },
      // 3-second timeout
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json() as { country_code?: string; error?: boolean };
    if (data.error || !data.country_code) {
      return NextResponse.json({ country_code: 'CA' });
    }
    return NextResponse.json({ country_code: data.country_code });
  } catch {
    // Fail open — don't block users if geo is down
    return NextResponse.json({ country_code: 'CA' });
  }
}
