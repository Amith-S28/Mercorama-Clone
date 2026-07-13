import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdvisorId } from '@/lib/auth';
import { readNotesFromCSV, writeNotesToCSV } from '@/lib/csv-db';
import type { AdvisorNote } from '@/types';

const upsertSchema = z.object({
  assessmentId: z.string().min(1),
  pillar: z.string().min(1),
  content: z.string(),
});

export async function GET(request: NextRequest) {
  const assessmentId = request.nextUrl.searchParams.get('assessmentId');
  if (!assessmentId) {
    return NextResponse.json({ error: 'assessmentId is required' }, { status: 400 });
  }

  try {
    const notes = readNotesFromCSV();
    const filtered = notes.filter((n) => n.assessmentId === assessmentId);
    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Error fetching advisor notes from CSV:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = upsertSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const advisorId = await getAdvisorId();
  const { assessmentId, pillar, content } = parsed.data;

  try {
    const notes = readNotesFromCSV();
    const index = notes.findIndex(
      (n) => n.assessmentId === assessmentId && n.pillar === pillar
    );

    let updatedNote: AdvisorNote;
    if (index !== -1) {
      updatedNote = {
        ...notes[index],
        content,
        updatedAt: new Date().toISOString(),
      };
      notes[index] = updatedNote;
    } else {
      updatedNote = {
        id: crypto.randomUUID(),
        assessmentId,
        advisorId,
        pillar,
        content,
        updatedAt: new Date().toISOString(),
      };
      notes.push(updatedNote);
    }

    writeNotesToCSV(notes);
    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error('Error upserting advisor note in CSV:', error);
    return NextResponse.json({ error: 'Failed to upsert advisor note' }, { status: 500 });
  }
}
