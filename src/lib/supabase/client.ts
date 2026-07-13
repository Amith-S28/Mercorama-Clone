import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export function createBrowserSupabaseClient(): SupabaseClient {
  const url = env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key';
  return createBrowserClient(url, key);
}
