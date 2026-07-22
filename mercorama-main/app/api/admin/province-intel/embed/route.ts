// app/api/admin/province-intel/embed/route.ts
// Generate and store embedding for province intelligence RAG.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminAuth';

export const runtime = 'nodejs';

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { province_code, category } = await req.json();
  if (!province_code || !category) {
    return NextResponse.json({ error: 'province_code and category required' }, { status: 400 });
  }

  const db = createServiceClient();

  // 1. Fetch key_insights
  const { data: row, error: fetchErr } = await db
    .from('province_intel')
    .select('id, key_insights')
    .eq('province_code', province_code)
    .eq('category', category)
    .maybeSingle();

  if (fetchErr || !row) {
    return NextResponse.json({ error: 'Province intel record not found' }, { status: 404 });
  }

  if (!row.key_insights) {
    return NextResponse.json({ error: 'key_insights is empty — save content first' }, { status: 400 });
  }

  // 2. Generate embedding via Ollama
  let embedding: number[];
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'nomic-embed-text', prompt: row.key_insights }),
    });
    if (!res.ok) throw new Error(`Ollama returned ${res.status}`);
    const data = await res.json();
    embedding = data.embedding;
    if (!Array.isArray(embedding) || embedding.length === 0) throw new Error('Empty embedding');
  } catch (err) {
    console.error('[mercorama] province-intel embed — Ollama failed:', err);
    return NextResponse.json({ error: 'Embedding generation failed — is Ollama running with nomic-embed-text?' }, { status: 503 });
  }

  // 3. Store embedding
  const { error: updateErr } = await db
    .from('province_intel')
    .update({ embedding: JSON.stringify(embedding) })
    .eq('id', row.id);

  if (updateErr) {
    console.error('[mercorama] province-intel embed — store failed:', updateErr);
    return NextResponse.json({ error: 'Failed to store embedding' }, { status: 500 });
  }

  return NextResponse.json({ success: true, dimensions: embedding.length });
}
