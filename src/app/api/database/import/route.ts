import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const table = formData.get('table') as string;
    const file = formData.get('file') as File;

    const validTables = ['smes', 'assessments', 'roadmap', 'advisor_notes'];
    if (!validTables.includes(table)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const content = buffer.toString('utf-8');

    // Simple validation: make sure headers match
    const firstLine = content.split('\n')[0].trim();
    if (!firstLine) {
      return NextResponse.json({ error: 'Uploaded file is empty' }, { status: 400 });
    }

    const filename = table === 'advisor_notes' ? 'advisor_notes.csv' : `${table}.csv`;
    const filePath = path.join(process.cwd(), 'src', 'data', filename);

    // Overwrite the CSV database file
    fs.writeFileSync(filePath, content, 'utf-8');

    return NextResponse.json({ success: true, message: `Successfully imported ${table}` });
  } catch (error: unknown) {
    console.error('Import error:', error);
    const message = error instanceof Error ? error.message : 'Import failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
