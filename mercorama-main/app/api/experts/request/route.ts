// app/api/experts/request/route.ts
// Creates a consultation request from a user to an expert.
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';
import { config } from '@/lib/config';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { expert_slug, description, target_market, engagement_type, timeline, budget_range, contact_email } = body;

  if (!expert_slug || !description || !contact_email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const db = createServiceClient();

  // Get expert
  const { data: expert } = await db
    .from('expert_profiles')
    .select('id, headline, user_id')
    .eq('slug', expert_slug)
    .eq('is_approved', true)
    .eq('is_active', true)
    .maybeSingle();

  if (!expert) return NextResponse.json({ error: 'Expert not found' }, { status: 404 });

  // Get authenticated user (optional — requests can come from non-logged-in users via email)
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch { /* anonymous request */ }

  // If no auth, create a placeholder — the contact_email is the identifier
  if (!userId) {
    // Check if there's an existing user with this email
    const { data: existingUser } = await db.auth.admin.listUsers();
    const match = (existingUser?.users ?? []).find((u) => u.email === contact_email);
    userId = match?.id ?? null;
  }

  if (!userId) {
    return NextResponse.json({ error: 'Please sign in or sign up to submit a request.' }, { status: 401 });
  }

  // Map engagement type
  const engType = engagement_type === 'advisory_call' ? 'advisory_call'
    : engagement_type === 'project_based' ? 'project_based'
    : 'not_sure';

  // Create request
  const { data: request, error } = await db
    .from('expert_requests')
    .insert({
      user_id: userId,
      expert_id: expert.id,
      status: 'submitted',
      engagement_type: engType,
      description,
      target_market: target_market || null,
      timeline: timeline || null,
      budget_range: budget_range || null,
      contact_email,
    })
    .select('id')
    .single();

  if (error || !request) {
    console.error('[mercorama] expert request create error:', error);
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }

  // Notify expert via email (best-effort)
  if (config.resendApiKey && expert.user_id) {
    try {
      const { data: expertUser } = await db.auth.admin.getUserById(expert.user_id);
      if (expertUser?.user?.email) {
        const { Resend } = await import('resend');
        const resend = new Resend(config.resendApiKey);
        await resend.emails.send({
          from: config.resendFromEmail,
          to: expertUser.user.email,
          subject: `New Consultation Request — Mercorama`,
          html: `
            <h2>You have a new consultation request</h2>
            <p><strong>From:</strong> ${contact_email}</p>
            <p><strong>Type:</strong> ${engType.replace('_', ' ')}</p>
            <p><strong>Target market:</strong> ${target_market || 'Not specified'}</p>
            <p><strong>Description:</strong></p>
            <p>${description}</p>
            ${timeline ? `<p><strong>Timeline:</strong> ${timeline}</p>` : ''}
            ${budget_range ? `<p><strong>Budget range:</strong> ${budget_range}</p>` : ''}
            <br/>
            <p>Log into your <a href="https://board.mercorama.com/studio/requests">Mercorama Studio</a> to review and respond.</p>
          `,
        });
      }
    } catch (emailErr) {
      console.error('[mercorama] expert request notification error:', emailErr);
    }
  }

  return NextResponse.json({ id: request.id, status: 'submitted' }, { status: 201 });
}
