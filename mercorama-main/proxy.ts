// proxy.ts
// Route-level auth guard + domain-based routing.
// mercorama.com        → marketing pages only (public)
// board.mercorama.com  → dashboard, auth, admin, APIs (app)

import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { ADMIN_EMAILS } from '@/lib/admin';

// ── Domain detection ──────────────────────────────────────────────────────────

function isBoard(request: NextRequest): boolean {
  const host =
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host') ??
    '';
  return host.startsWith('board.');
}

// ── Board-only paths (blocked on marketing domain) ────────────────────────────

const BOARD_ONLY_PREFIXES = [
  '/dashboard',
  '/admin',
  '/auth',
  '/analyze',
  '/checkout',
  '/export-compass/profile',
  '/book',
  '/booking',
  '/studio',
];

// ── Marketing-only paths (redirected to marketing on board domain) ─────────

const MARKETING_ONLY_PREFIXES = [
  '/about',
  '/blog',
  '/contact',
  '/beta',
  '/waitlist',
  '/pricing',
  '/terms',
  '/privacy',
  '/data-sources',
  '/data-retention',
  '/activate',
];

// ── Routes that require any authenticated session ─────────────────────────────

const PROTECTED_PREFIXES = ['/dashboard'];

// ── Routes that also require admin access ─────────────────────────────────────

const ADMIN_PREFIXES = ['/admin'];

// ── API routes always pass through without auth check ─────────────────────────

const PUBLIC_API_PREFIXES = [
  '/api/beta/apply',
  '/api/beta/status',
  '/api/activate',
  '/api/stripe/webhook',
  '/api/freight-connect/stripe/webhook',
  '/api/geo',
  '/api/international-waitlist',
  '/api/waitlist',
  '/api/auth',
  '/api/contact',
  '/api/experts',
  '/api/experts/request',
  '/api/webhooks/expert-booking',
  '/api/studio',
  '/api/bookings',
];

function startsWithAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );
}

const BOARD_URL = process.env.NEXT_PUBLIC_BOARD_URL ?? 'https://board.mercorama.com';
const MARKETING_URL = process.env.NEXT_PUBLIC_MARKETING_URL ?? 'https://mercorama.com';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const onBoard = isBoard(request);

  // ── Domain routing ────────────────────────────────────────────────────────

  // On marketing domain: block board-only routes → redirect to board
  if (!onBoard && startsWithAny(pathname, BOARD_ONLY_PREFIXES)) {
    return NextResponse.redirect(new URL(pathname + request.nextUrl.search, BOARD_URL));
  }

  // On board domain: redirect marketing-only pages → marketing site
  if (onBoard && startsWithAny(pathname, MARKETING_ONLY_PREFIXES)) {
    return NextResponse.redirect(new URL(pathname, MARKETING_URL));
  }

  // On board domain: redirect / → /dashboard
  if (onBoard && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', BOARD_URL));
  }

  // ── Public API routes ───────────────────────────────────────────────────

  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ── Refresh session cookie and get verified user ────────────────────────

  const { supabaseResponse, user } = await updateSession(request);

  // ── Admin routes ────────────────────────────────────────────────────────

  if (startsWithAny(pathname, ADMIN_PREFIXES)) {
    if (!user) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (!ADMIN_EMAILS.includes((user.email ?? '').toLowerCase())) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return supabaseResponse;
  }

  // ── Protected tool routes ───────────────────────────────────────────────

  if (startsWithAny(pathname, PROTECTED_PREFIXES)) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/auth/signin';
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return supabaseResponse;
  }

  // ── All other routes are public ─────────────────────────────────────────

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
};
