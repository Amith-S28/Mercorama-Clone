// app/api/admin/changelog/route.ts
// GET — list changelog entries. POST — add manual entry.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminAuth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  const { data, error } = await db
    .from('admin_changelog')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: 'server_error' }, { status: 500 });
  return NextResponse.json({ entries: data ?? [] });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    entry_type: string;
    title: string;
    description?: string;
    affected_tables?: string[];
    severity: string;
  };

  if (!body.entry_type || !body.title || !body.severity) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  const db = createServiceClient();
  const { error } = await db.from('admin_changelog').insert({
    entry_type:      body.entry_type,
    title:           body.title,
    description:     body.description ?? '',
    affected_tables: body.affected_tables ?? [],
    created_by:      admin.email,
    severity:        body.severity,
  });

  if (error) return NextResponse.json({ error: 'server_error' }, { status: 500 });
  return NextResponse.json({ success: true }, { status: 201 });
}
