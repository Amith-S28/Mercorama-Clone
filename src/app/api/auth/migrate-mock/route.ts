import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { env, isSupabaseConfigured } from '@/lib/env';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const bodySchema = z.object({
  newUserId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { newUserId } = parsed.data;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      success: true,
      mock: true,
      migrated: 0,
      message: 'Supabase not configured — mock advisor data remains in local memory.',
      mockAdvisorId: env.MOCK_ADVISOR_ID,
      newUserId,
    });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase.rpc('migrate_mock_advisor_data', {
      new_user_id: newUserId,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Migration failed', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mock: false,
      migrated: typeof data === 'number' ? data : 0,
      newUserId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Migration RPC failed';
    return NextResponse.json({ error: 'Migration failed', message }, { status: 500 });
  }
}
