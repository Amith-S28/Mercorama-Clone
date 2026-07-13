import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdvisorId } from '@/lib/auth';
import { readRoadmapFromCSV, writeRoadmapToCSV } from '@/lib/csv-db';
import type { RoadmapItem } from '@/types';

const createSchema = z.object({
  assessmentId: z.string().min(1),
  task: z.string().min(1),
  bucket: z.enum(['30-day', '60-day', '90-day']),
  sortOrder: z.number().int().min(0).optional(),
});

const updateSchema = z.object({
  id: z.string().min(1),
  task: z.string().min(1).optional(),
  bucket: z.enum(['30-day', '60-day', '90-day']).optional(),
  sortOrder: z.number().int().min(0).optional(),
  completed: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const assessmentId = request.nextUrl.searchParams.get('assessmentId');
  if (!assessmentId) {
    return NextResponse.json({ error: 'assessmentId is required' }, { status: 400 });
  }

  try {
    const items = readRoadmapFromCSV();
    const filtered = items
      .filter((item) => item.assessmentId === assessmentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Error reading roadmap from CSV:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const advisorId = await getAdvisorId();
  const input = parsed.data;

  try {
    const items = readRoadmapFromCSV();
    const newItem: RoadmapItem = {
      id: crypto.randomUUID(),
      assessmentId: input.assessmentId,
      advisorId,
      task: input.task,
      bucket: input.bucket,
      sortOrder: input.sortOrder ?? 0,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    items.push(newItem);
    writeRoadmapToCSV(items);

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Error creating roadmap item in CSV:', error);
    return NextResponse.json({ error: 'Failed to create roadmap item' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...patch } = parsed.data;

  try {
    const items = readRoadmapFromCSV();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const currentItem = items[index];
    const updatedItem: RoadmapItem = {
      ...currentItem,
      ...(patch.task !== undefined ? { task: patch.task } : {}),
      ...(patch.bucket !== undefined ? { bucket: patch.bucket } : {}),
      ...(patch.sortOrder !== undefined ? { sortOrder: patch.sortOrder } : {}),
      ...(patch.completed !== undefined ? { completed: patch.completed } : {}),
    };

    items[index] = updatedItem;
    writeRoadmapToCSV(items);

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating roadmap item in CSV:', error);
    return NextResponse.json({ error: 'Failed to update roadmap item' }, { status: 500 });
  }
}
