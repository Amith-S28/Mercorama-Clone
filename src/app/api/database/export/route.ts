import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const table = request.nextUrl.searchParams.get('table') ?? 'smes';
  const validTables = ['smes', 'assessments', 'roadmap', 'advisor_notes'];
  if (!validTables.includes(table)) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
  }

  const filename = table === 'advisor_notes' ? 'advisor_notes.csv' : `${table}.csv`;
  const filePath = path.join(process.cwd(), 'src', 'data', filename);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return new Response(content, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
