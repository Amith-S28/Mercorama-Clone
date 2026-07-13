import { NextRequest, NextResponse } from 'next/server';
import { withMockFallback } from '@/lib/api-client';
import { checkSanctions, normalizeQuery } from '@/lib/sanctions-checker';
import { env, isServiceConfigured } from '@/lib/env';
import { mockSanctionsPayload } from '@/lib/mock-fallback-data';
import type { SanctionsScreeningResult } from '@/types';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? '';

  const { data, origin } = await withMockFallback(
    'csl',
    async () => {
      const url = `https://data.trade.gov/consolidated_screening_list/v1/search?name=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        headers: env.CSL_API_KEY ? { 'subscription-key': env.CSL_API_KEY } : {},
      });
      if (!res.ok) throw new Error(`CSL HTTP ${res.status}`);
      const payload = (await res.json()) as { results?: { name: string; source: string }[] };
      const normalizedQuery = normalizeQuery(q);
      const matchedEntries = (payload.results ?? []).map((r) => ({
        name: r.name,
        source: r.source,
      }));
      const result: SanctionsScreeningResult = {
        inputQuery: q,
        normalizedQuery,
        match: matchedEntries.length > 0,
        matchedEntries,
        source: 'CSL live',
        sourceVersion: 'live',
        screenedAt: new Date().toISOString(),
        dataOrigin: 'live',
      };
      return result;
    },
    () => {
      const mock = mockSanctionsPayload(q);
      const fallback = checkSanctions(q, 'mock-fallback');
      return {
        ...fallback,
        match: mock.match || fallback.match,
        matchedEntries: fallback.matchedEntries,
      };
    },
    isServiceConfigured('CSL_API_KEY')
  );

  return NextResponse.json(data, { headers: { 'data-origin': origin } });
}
