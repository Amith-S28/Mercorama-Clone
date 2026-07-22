// app/api/admin/trigger-cron/route.ts
// Admin proxy: triggers cron endpoints with the server-side CRON_SECRET.
// Waits for completion and returns actual status (not fire-and-forget).
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { config } from '@/lib/config';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { endpoint } = await req.json();
  if (!endpoint || !endpoint.startsWith('/api/cron/')) {
    return NextResponse.json({ error: 'Invalid cron endpoint' }, { status: 400 });
  }

  const url = `http://localhost:3000${endpoint}`;
  const t0 = Date.now();

  try {
    // Use AbortController with 120s timeout (fits within maxDuration)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    const res = await fetch(url, {
      headers: {
        'x-cron-secret': config.cronSecret,
        // Also send authorization header for routes that use Bearer auth
        'authorization': `Bearer ${process.env.FUNDING_SYNC_SECRET ?? config.cronSecret}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await res.json().catch(() => ({ status: res.status }));
    const duration = Date.now() - t0;

    console.log(`[mercorama] trigger-cron ${endpoint}: ${res.ok ? 'OK' : 'FAILED'} in ${duration}ms`);

    return NextResponse.json({ ok: res.ok, status: res.status, data, duration });
  } catch (err) {
    const duration = Date.now() - t0;
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    console.error(`[mercorama] trigger-cron ${endpoint}: ${isTimeout ? 'TIMEOUT' : 'ERROR'} in ${duration}ms`);

    if (isTimeout) {
      return NextResponse.json({
        ok: false,
        status: 504,
        data: { error: `Sync timed out after ${Math.round(duration / 1000)}s. It may still be running on the server.` },
        duration,
      });
    }

    return NextResponse.json({
      ok: false,
      status: 500,
      data: { error: err instanceof Error ? err.message : 'Cron trigger failed' },
      duration,
    });
  }
}
