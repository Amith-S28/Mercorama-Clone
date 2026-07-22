// app/api/studio/proposals/route.ts — Expert creates a proposal for a request
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';
import { config } from '@/lib/config';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  const { data: profile } = await db.from('expert_profiles').select('id, headline').eq('user_id', user.id).maybeSingle();
  if (!profile) return NextResponse.json({ error: 'Not an expert' }, { status: 403 });

  const body = await req.json();
  const { request_id, title, deliverables, timeline, price_cents, currency, message } = body;

  if (!request_id || !title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Verify request belongs to this expert
  const { data: request } = await db
    .from('expert_requests')
    .select('id, contact_email, user_id')
    .eq('id', request_id)
    .eq('expert_id', profile.id)
    .maybeSingle();

  if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

  // Create proposal
  const { data: proposal, error } = await db
    .from('expert_proposals')
    .insert({
      request_id,
      expert_id: profile.id,
      title,
      deliverables: deliverables ?? [],
      timeline: timeline ?? null,
      price_cents: price_cents ?? 0,
      currency: currency ?? 'CAD',
      message: message ?? null,
    })
    .select('id')
    .single();

  if (error || !proposal) {
    console.error('[mercorama] proposal create error:', error);
    return NextResponse.json({ error: 'Failed to create proposal' }, { status: 500 });
  }

  // Update request status
  await db.from('expert_requests').update({ status: 'proposal_sent' }).eq('id', request_id);

  // Notify user via email
  if (config.resendApiKey && request.contact_email) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(config.resendApiKey);
      const priceLabel = price_cents === 0 ? 'Free' : `$${(price_cents / 100).toFixed(0)} ${currency ?? 'CAD'}`;
      await resend.emails.send({
        from: config.resendFromEmail,
        to: request.contact_email,
        subject: `Proposal from ${profile.headline.split('—')[0].trim()} — Mercorama`,
        html: `
          <h2>You have a new proposal</h2>
          <p><strong>${title}</strong></p>
          <p>${message ?? ''}</p>
          <p><strong>Price:</strong> ${priceLabel}</p>
          ${timeline ? `<p><strong>Timeline:</strong> ${timeline}</p>` : ''}
          <br/>
          <p>Log into <a href="https://board.mercorama.com/dashboard/requests">your dashboard</a> to view the full proposal and accept.</p>
        `,
      });
    } catch (emailErr) {
      console.error('[mercorama] proposal notification error:', emailErr);
    }
  }

  return NextResponse.json({ id: proposal.id }, { status: 201 });
}
