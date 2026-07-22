// app/api/admin/province-intel/generate/route.ts
// AI-generated key_insights summary for province intelligence.
import { NextRequest, NextResponse } from 'next/server';
import { callClaudeHaiku } from '@/lib/claude';
import { requireAdmin } from '@/lib/adminAuth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { province_name, category, market_size, consumer_profile, competition_intensity, top_retail_chains, top_distributors } = body;

  const prompt = `Write a 150-word strategic summary for a ${category} brand considering entry into the ${province_name} Canada market.

Use the following data:
- Market size: ${market_size || 'Unknown'}
- Consumer profile: ${consumer_profile || 'Unknown'}
- Competition: ${competition_intensity || 'Unknown'}
- Key retail chains: ${top_retail_chains || 'Unknown'}
- Key distributors: ${top_distributors || 'Unknown'}

Write in plain English. Be specific. Name real chains and distributors. Include actionable entry advice. Do not use bullet points — write as a cohesive narrative paragraph.`;

  try {
    const summary = await callClaudeHaiku(prompt);
    return NextResponse.json({ summary: summary.trim() });
  } catch (err) {
    console.error('[mercorama] province-intel generate failed:', err);
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
  }
}
