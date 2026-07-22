// app/api/me/route.ts
// Returns the current user's plan from the users table.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase';
import { ADMIN_EMAILS } from '@/lib/admin';

export const runtime = 'nodejs';

// Maps DB plan_tier values to internal PlanId
function toPlanId(dbPlan: string | null | undefined): 'pro' | 'team' | 'enterprise' {
  if (dbPlan === 'growth') return 'team';
  if (dbPlan === 'team') return 'team';
  if (dbPlan === 'enterprise') return 'enterprise';
  // 'starter' or anything else → pro
  return 'pro';
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  // Admin emails always get enterprise — no DB lookup needed
  if (ADMIN_EMAILS.includes((user.email ?? '').toLowerCase())) {
    return NextResponse.json({ id: user.id, email: user.email, plan: 'enterprise' });
  }

  const db = createServiceClient();
  const { data } = await db
    .from('users')
    .select('plan_tier')
    .eq('id', user.id)
    .maybeSingle();

  return NextResponse.json({
    id: user.id,
    email: user.email,
    plan: toPlanId(data?.plan_tier),
  });
}
