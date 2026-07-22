// lib/user-overrides.ts
// Per-email plan assignments. Checked at sign-in and sign-up.
// Replace with a Supabase users table lookup when real auth is wired up.

import type { AuthUser } from './auth-store';

export const USER_PLAN_OVERRIDES: Record<string, AuthUser['plan']> = {
  'team@buildgrt.com': 'team',
};

export function getUserPlan(email: string): AuthUser['plan'] {
  return USER_PLAN_OVERRIDES[email.toLowerCase().trim()] ?? 'free';
}
