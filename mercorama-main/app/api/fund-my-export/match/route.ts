// app/api/fund-my-export/match/route.ts
// Handles both passive (panel auto-load) and active (form submit) match requests.

import { NextRequest, NextResponse } from 'next/server';
import { getFundingMatches, type FundingQuery } from '@/lib/fundMyExport';
import { checkAndIncrementRun } from '@/lib/fundMyExportRuns';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { query: FundingQuery; passive?: boolean };
    const { query, passive = false } = body;

    if (!query?.sector && !query?.destination_country) {
      return NextResponse.json(
        { error: 'Query must include at least sector or destination_country' },
        { status: 400 }
      );
    }

    if (!passive) {
      // Active submission — enforce run limit
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const runStatus = await checkAndIncrementRun(user.id);
      if (!runStatus.can_run) {
        return NextResponse.json(
          {
            error: 'limit_reached',
            runs_used: runStatus.runs_used,
            limit: runStatus.limit,
            year_month: runStatus.year_month,
          },
          { status: 429 }
        );
      }
    }

    const result = await getFundingMatches(query);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[mercorama] fund-my-export match error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
