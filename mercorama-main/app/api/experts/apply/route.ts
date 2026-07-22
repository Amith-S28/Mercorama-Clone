// app/api/experts/apply/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { config } from '@/lib/config';

export const runtime = 'nodejs';

const REQUIRED = ['full_name', 'email', 'linkedin_url', 'location_country', 'location_city', 'expert_type', 'years_experience', 'bio', 'availability', 'video_intro_url'] as const;
const ACCEPTED_VIDEO_DOMAINS = ['loom.com', 'youtube.com', 'youtu.be', 'vimeo.com', 'drive.google.com', 'dropbox.com', 'wistia.com'];
const REQUIRED_ARRAYS = ['regions_served', 'engagement_types', 'collaboration_types'] as const;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  // Validate required fields
  const errors: Record<string, string> = {};
  for (const f of REQUIRED) {
    if (!body[f] || (typeof body[f] === 'string' && !(body[f] as string).trim())) {
      errors[f] = `${f.replace(/_/g, ' ')} is required`;
    }
  }
  for (const f of REQUIRED_ARRAYS) {
    if (!Array.isArray(body[f]) || (body[f] as string[]).length === 0) {
      errors[f] = `${f.replace(/_/g, ' ')} must have at least one selection`;
    }
  }

  // Bio length
  const bio = typeof body.bio === 'string' ? body.bio.trim() : '';
  if (bio.length < 100) errors.bio = 'Bio must be at least 100 characters';
  if (bio.length > 600) errors.bio = 'Bio must be 600 characters or fewer';

  // Email format
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email address';

  // Video URL validation
  const videoUrl = typeof body.video_intro_url === 'string' ? body.video_intro_url.trim() : '';
  if (videoUrl && !videoUrl.startsWith('https://')) errors.video_intro_url = 'URL must start with https://';
  if (videoUrl && !ACCEPTED_VIDEO_DOMAINS.some((d) => videoUrl.includes(d))) {
    errors.video_intro_url = 'Please use Loom, YouTube, Vimeo, Google Drive, or Dropbox to share your video.';
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: 'Validation failed', errors }, { status: 400 });
  }

  const db = createServiceClient();

  // Duplicate check
  const { data: existing } = await db
    .from('expert_applications')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      error: 'An application with this email already exists. Contact us at hello@mercorama.com if you need to update it.',
    }, { status: 409 });
  }

  const { data, error } = await db
    .from('expert_applications')
    .insert({
      full_name: (body.full_name as string).trim(),
      email,
      phone: (body.phone as string)?.trim() ? `${(body.phone_code as string) ?? '+1'} ${(body.phone as string).trim()}` : null,
      linkedin_url: (body.linkedin_url as string).trim(),
      website_url: (body.website_url as string)?.trim() || null,
      location_country: (body.location_country as string).trim(),
      location_province: (body.location_province as string)?.trim() || null,
      location_city: (body.location_city as string).trim(),
      expert_type: (body.expert_type as string).trim(),
      credentials: body.credentials ?? [],
      additional_certifications: (body.additional_certifications as string)?.trim() || null,
      notable_achievements: (body.notable_achievements as string)?.trim() || null,
      video_intro_url: (body.video_intro_url as string)?.trim() ?? '',
      specializations: body.specializations ?? [],
      years_experience: (body.years_experience as string).trim(),
      regions_served: body.regions_served ?? [],
      languages: body.languages ?? [],
      bio,
      engagement_types: body.engagement_types ?? [],
      session_ideas: (body.session_ideas as string)?.trim() || null,
      collaboration_types: body.collaboration_types ?? [],
      availability: (body.availability as string).trim(),
      referral_source: (body.referral_source as string)?.trim() || null,
      additional_notes: (body.additional_notes as string)?.trim() || null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[mercorama] expert application error:', error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }

  // Send emails (best-effort — don't fail the submission if email fails)
  const fullName = (body.full_name as string).trim();
  const firstName = fullName.split(' ')[0];

  if (config.resendApiKey) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(config.resendApiKey);

      // 1. Confirmation email to applicant
      await resend.emails.send({
        from: config.resendFromEmail,
        to: email,
        subject: 'Application Received — Mercorama Expert Network',
        html: `
          <h2>Thanks for applying, ${firstName}!</h2>
          <p>We've received your application to join Mercorama's Verified Trade Expert Network.</p>
          <p><strong>What happens next:</strong></p>
          <ul>
            <li>Our team will review your application within 5 business days.</li>
            <li>We'll watch your video introduction and review your credentials.</li>
            <li>If approved, we'll schedule a brief onboarding call to discuss collaboration terms.</li>
          </ul>
          <p>In the meantime, feel free to explore the platform at <a href="https://mercorama.com">mercorama.com</a>.</p>
          <br/>
          <p style="color: #666; font-size: 12px;">Mercorama — AI-Powered Trade Intelligence for Canadian SMEs</p>
        `,
      });

      // 2. Admin notification
      await resend.emails.send({
        from: config.resendFromEmail,
        to: 'team@buildgrt.com',
        subject: `New Expert Application — ${fullName}`,
        html: `
          <h2>New Expert Application</h2>
          <table style="border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Name</td><td>${fullName}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Phone</td><td>${(body.phone as string)?.trim() || '—'}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Location</td><td>${(body.location_city as string)?.trim()}, ${(body.location_province as string)?.trim() || ''} ${(body.location_country as string)?.trim()}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">LinkedIn</td><td><a href="${(body.linkedin_url as string)?.trim()}">${(body.linkedin_url as string)?.trim()}</a></td></tr>
            <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Primary Role</td><td>${(body.expert_type as string)?.trim()}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Credentials</td><td>${(body.credentials as string[])?.join(', ') || '—'}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Experience</td><td>${(body.years_experience as string)?.trim()}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Regions</td><td>${(body.regions_served as string[])?.join(', ')}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Video</td><td><a href="${(body.video_intro_url as string)?.trim()}">Watch Video</a></td></tr>
            <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Availability</td><td>${(body.availability as string)?.trim()}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Referral</td><td>${(body.referral_source as string)?.trim() || '—'}</td></tr>
          </table>
          <br/>
          <p><strong>Bio:</strong></p>
          <p>${bio}</p>
          ${(body.notable_achievements as string)?.trim() ? `<p><strong>Notable Achievements:</strong></p><p>${(body.notable_achievements as string).trim()}</p>` : ''}
          ${(body.additional_certifications as string)?.trim() ? `<p><strong>Additional Certifications:</strong> ${(body.additional_certifications as string).trim()}</p>` : ''}
          <br/>
          <p><a href="https://board.mercorama.com/admin/experts">Review in Admin Panel →</a></p>
        `,
      });
    } catch (emailErr) {
      console.error('[mercorama] expert application email error:', emailErr);
      // Don't fail the submission — application is already saved
    }
  }

  return NextResponse.json({ success: true, application_id: data.id }, { status: 201 });
}
