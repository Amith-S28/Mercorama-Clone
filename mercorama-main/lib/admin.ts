// Admin check — tries localStorage first, falls back to Supabase session.
import { getAuthUser } from '@/lib/auth-store';

export const ADMIN_EMAILS = ['team@buildgrt.com'];

/** Synchronous check — localStorage only (may return false before sidebar hydrates). */
export function isAdmin(): boolean {
  const user = getAuthUser();
  if (!user) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}

/** Async check — queries Supabase session directly. Reliable on first load. */
export async function checkIsAdmin(): Promise<boolean> {
  // Fast path: localStorage already populated
  if (isAdmin()) return true;
  // Slow path: ask Supabase
  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return false;
    return ADMIN_EMAILS.includes(user.email.toLowerCase());
  } catch {
    return false;
  }
}

export function useIsAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  return isAdmin();
}
