import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/**
 * Service-role client — server-only. Never import from client components.
 */
export function createAdminSupabaseClient(): SupabaseClient {
  const url = env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'service-role-key';
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
