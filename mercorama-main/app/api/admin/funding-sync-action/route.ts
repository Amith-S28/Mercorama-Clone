// app/api/admin/funding-sync-action/route.ts
// Admin actions: approve or dismiss a pending funding_program_change

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { approvePendingChange } from '@/lib/fundingSync';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();

  // Verify admin via Supabase auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json() as { action: 'approve' | 'dismiss'; change_id: string };
  const { action, change_id } = body;

  if (!change_id) {
    return NextResponse.json({ error: 'change_id required' }, { status: 400 });
  }

  try {
    if (action === 'approve') {
      await approvePendingChange(change_id, user.email ?? user.id);
      return NextResponse.json({ ok: true, action: 'approved' });
    }

    if (action === 'dismiss') {
      // Delete the pending change without applying it
      const { error } = await supabase
        .from('funding_program_changes')
        .delete()
        .eq('id', change_id);

      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true, action: 'dismissed' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[mercorama] funding-sync-action error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
