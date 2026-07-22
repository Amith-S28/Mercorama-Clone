// app/api/cron/expert-reminders/route.ts
// Sends reminder emails 24 hours before confirmed expert sessions.
// Run daily via crontab: 0 8 * * * curl -s -H "x-cron-secret: $CRON_SECRET" http://localhost:3000/api/cron/expert-reminders
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { config } from '@/lib/config';

export const runtime = 'nodejs';

const CRON_SECRET = process.env.CRON_SECRET ?? '';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('x-cron-secret');
  if (CRON_SECRET && auth !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!config.resendApiKey) {
    return NextResponse.json({ error: 'Resend not configured' }, { status: 500 });
  }

  const db = createServiceClient();

  // Find confirmed bookings scheduled in the next 24-28 hours (run once daily at 8am)
  const now = new Date();
  const from = new Date(now.getTime() + 20 * 60 * 60 * 1000); // 20h from now
  const to = new Date(now.getTime() + 28 * 60 * 60 * 1000);   // 28h from now

  const { data: bookings } = await db
    .from('expert_bookings')
    .select(`
      id, scheduled_at, user_id,
      expert_profiles!expert_bookings_expert_id_fkey(headline, user_id),
      expert_session_types!expert_bookings_session_type_id_fkey(title, duration_minutes)
    `)
    .eq('status', 'confirmed')
    .gte('scheduled_at', from.toISOString())
    .lte('scheduled_at', to.toISOString());

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const { Resend } = await import('resend');
  const resend = new Resend(config.resendApiKey);
  let sent = 0;

  for (const b of bookings) {
    const expert = b.expert_profiles as { headline: string; user_id: string | null };
    const session = b.expert_session_types as { title: string; duration_minutes: number };
    const date = new Date(b.scheduled_at);
    const dateStr = date.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' });

    // Remind user
    try {
      const { data: userData } = await db.auth.admin.getUserById(b.user_id);
      if (userData?.user?.email) {
        await resend.emails.send({
          from: config.resendFromEmail,
          to: userData.user.email,
          subject: `Reminder: ${session.title} tomorrow`,
          html: `<h2>Session Reminder</h2><p><strong>${session.title}</strong> with ${expert.headline.split('—')[0].trim()}</p><p>${dateStr} at ${timeStr} · ${session.duration_minutes} minutes</p><p>Prepare any questions or documents you'd like to discuss.</p>`,
        });
        sent++;
      }
    } catch (err) {
      console.error(`[mercorama] expert-reminder: failed for booking ${b.id}:`, err);
    }

    // Remind expert
    if (expert.user_id) {
      try {
        const { data: expertUser } = await db.auth.admin.getUserById(expert.user_id);
        if (expertUser?.user?.email) {
          await resend.emails.send({
            from: config.resendFromEmail,
            to: expertUser.user.email,
            subject: `Reminder: ${session.title} tomorrow`,
            html: `<h2>Upcoming Session</h2><p><strong>${session.title}</strong></p><p>${dateStr} at ${timeStr} · ${session.duration_minutes} minutes</p><p>You have a client session scheduled. Please be ready.</p>`,
          });
          sent++;
        }
      } catch (err) {
        console.error(`[mercorama] expert-reminder (expert): failed for booking ${b.id}:`, err);
      }
    }
  }

  return NextResponse.json({ sent, bookings_checked: bookings.length });
}
