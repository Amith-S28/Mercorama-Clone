// app/api/admin/freight-connect/forwarders/route.ts
// GET: list of all forwarders with lead stats. POST: change forwarder state.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminAuth';
import { suspendForwarder, reinstateForwarder } from '@/lib/freightConnect';
import { Resend } from 'resend';
import { config } from '@/lib/config';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const stateFilter    = sp.get('state')     ?? '';
  const tierFilter     = sp.get('tier')      ?? '';
  const provinceFilter = sp.get('province')  ?? '';
  const lowResponse    = sp.get('low_response') === '1'; // response_rate < 50%

  const db = createServiceClient();

  let query = db
    .from('freight_forwarders')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (stateFilter)    query = query.eq('state', stateFilter);
  if (tierFilter)     query = query.eq('subscription_tier', tierFilter);
  if (provinceFilter) query = query.contains('provinces', [provinceFilter]);

  const { data: forwarders, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Augment each forwarder with this-month lead counts + response rate
  const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const ids = (forwarders ?? []).map((f) => f.id);
  let quoteCounts: Record<string, { total: number; responded: number }> = {};

  if (ids.length > 0) {
    const { data: qdata } = await db
      .from('quote_requests')
      .select('forwarder_id, state')
      .in('forwarder_id', ids)
      .gte('created_at', thisMonthStart);

    for (const q of (qdata ?? [])) {
      if (!quoteCounts[q.forwarder_id]) quoteCounts[q.forwarder_id] = { total: 0, responded: 0 };
      quoteCounts[q.forwarder_id].total++;
      if (q.state === 'responded') quoteCounts[q.forwarder_id].responded++;
    }
  }

  let rows = (forwarders ?? []).map((ff) => {
    const stats = quoteCounts[ff.id] ?? { total: 0, responded: 0 };
    const responseRate = stats.total === 0 ? null : Math.round((stats.responded / stats.total) * 100);
    return { ...ff, leads_this_month: stats.total, response_rate: responseRate };
  });

  if (lowResponse) {
    rows = rows.filter((r) => r.response_rate !== null && r.response_rate < 50);
  }

  return NextResponse.json({ forwarders: rows, total: count ?? 0 });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    forwarder_id: string;
    action: 'suspend' | 'reinstate' | 'promote' | 'demote';
    tier?: 'claimed' | 'verified' | 'featured';
  };

  const { forwarder_id, action, tier } = body;
  if (!forwarder_id || !action) return NextResponse.json({ error: 'forwarder_id and action required' }, { status: 400 });

  const db = createServiceClient();

  switch (action) {
    case 'suspend':
      await suspendForwarder(forwarder_id);
      // Notify forwarder
      {
        const { data: ff } = await db
          .from('freight_forwarders')
          .select('company_name, primary_contact_email')
          .eq('id', forwarder_id)
          .single();
        if (ff?.primary_contact_email && config.resendApiKey) {
          const resend = new Resend(config.resendApiKey);
          await resend.emails.send({
            from:    config.resendFromEmail,
            to:      ff.primary_contact_email,
            subject: 'Your Freight Connect listing has been suspended',
            html: `<p>Hi ${ff.company_name}, your Mercorama Freight Connect listing has been suspended by our team. Contact <a href="mailto:support@mercorama.com">support@mercorama.com</a> for details.</p>`,
          }).catch(() => {});
        }
      }
      break;

    case 'reinstate':
      await reinstateForwarder(forwarder_id);
      break;

    case 'promote':
    case 'demote':
      if (!tier) return NextResponse.json({ error: 'tier required for promote/demote' }, { status: 400 });
      {
        const newState = tier === 'claimed' ? 'claimed' : tier;
        const newSub   = tier === 'claimed' ? 'none' : tier;
        await db
          .from('freight_forwarders')
          .update({ state: newState, subscription_tier: newSub })
          .eq('id', forwarder_id);
      }
      break;

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, action, forwarder_id });
}
