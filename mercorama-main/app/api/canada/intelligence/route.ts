// app/api/canada/intelligence/route.ts
// RAG-powered province intelligence search.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';

async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${OLLAMA_BASE}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'nomic-embed-text', prompt: text }),
  });
  if (!res.ok) throw new Error(`Embedding failed: ${res.status}`);
  const data = await res.json();
  return data.embedding;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { province_code, category, query } = body;

  if (!query) {
    return NextResponse.json({ error: 'query required' }, { status: 400 });
  }

  try {
    const embedding = await getEmbedding(query);
    const db = createServiceClient();

    const { data, error } = await db.rpc('search_province_intel', {
      query_embedding: JSON.stringify(embedding),
      match_category: category ?? null,
      match_count: 4,
    });

    if (error) {
      console.error('[mercorama] canada/intelligence RPC error:', error);
      return NextResponse.json({ error: 'Intelligence search failed' }, { status: 500 });
    }

    // Filter by province if specified
    const results = province_code
      ? (data ?? []).filter((r: Record<string, unknown>) => r.province_code === province_code)
      : (data ?? []);

    return NextResponse.json(results);
  } catch (err) {
    // Ollama not available — fall back to direct Supabase lookup
    console.error('[mercorama] canada/intelligence embedding failed, falling back:', err);
    const db = createServiceClient();

    let q = db.from('province_intel').select('id, province_code, category, key_insights');
    if (province_code) q = q.eq('province_code', province_code);
    if (category) q = q.eq('category', category);

    const { data, error } = await q.limit(4);
    if (error) {
      return NextResponse.json({ error: 'Intelligence lookup failed' }, { status: 500 });
    }

    return NextResponse.json((data ?? []).map((r: Record<string, unknown>) => ({ ...r, similarity: null })));
  }
}
