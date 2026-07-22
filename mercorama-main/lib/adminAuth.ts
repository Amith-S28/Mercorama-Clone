// lib/adminAuth.ts
// Verifies admin access for API route handlers via Supabase SSR session.
import 'server-only';
import { type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { ADMIN_EMAILS } from '@/lib/admin';

export async function requireAdmin(
  req?: NextRequest
): Promise<{ email: string } | null> {
  if (!req) return null;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {
          // Route handlers can't set cookies on the request; no-op here.
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const email = user.email.toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) return null;

  return { email };
}
