// app/api/data-flags/route.ts
// POST — submit a user-reported data flag. No auth required.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    table_name: string;
    record_id:  string;
    flag_type:  string;
    details:    Record<string, unknown>;
  };

  if (!body.table_name || !body.flag_type) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  const db = createServiceClient();
  const { error } = await db.from('data_quality_flags').insert({
    table_name: body.table_name,
    record_id:  body.record_id || null,
    flag_type:  'user_reported',
    details:    body.details ?? {},
    status:     'open',
  });

  if (error) {
    console.error('[data-flags] insert error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
