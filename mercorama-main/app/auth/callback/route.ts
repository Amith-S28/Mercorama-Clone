// app/auth/callback/route.ts
// Handles the Supabase auth callback (password recovery, magic link, OAuth).
// Exchanges the code for a session and redirects to the appropriate page.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ADMIN_EMAILS } from '@/lib/admin';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code      = searchParams.get('code');
  const tokenHash = searchParams.get('tokenHash') ?? searchParams.get('token_hash');
  const type      = searchParams.get('type') ?? 'recovery';
  const next      = searchParams.get('next') ?? '/auth/reset-password';

  // On Hetzner (behind Nginx), request.url has internal address (127.0.0.1:3000).
  // Use forwarded headers to build the public-facing origin.
  const forwardedHost  = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
  const publicOrigin   = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : (process.env.NEXT_PUBLIC_SITE_URL ?? origin);

  const supabase = await createClient();

  // OAuth / magic-link code exchange
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const email = (data.user?.email ?? '').toLowerCase();
      const destination = ADMIN_EMAILS.includes(email) ? next : '/beta';
      return NextResponse.redirect(`${publicOrigin}${destination}`);
    }
  }

  // Password recovery via TokenHash (from email template)
  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'recovery' | 'email' | 'signup' | 'invite' | 'magiclink',
    });
    if (!error) return NextResponse.redirect(`${publicOrigin}${next}`);
  }

  return NextResponse.redirect(`${publicOrigin}/auth/signin?error=link_expired`);
}
