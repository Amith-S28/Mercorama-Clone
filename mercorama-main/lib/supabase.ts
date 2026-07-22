import { createClient } from '@supabase/supabase-js';

// Access Supabase vars directly — do NOT import lib/config here.
// config.ts calls requireEnv() for all vars (including ANTHROPIC_API_KEY)
// at module load time, which throws on the client where server-only vars are absent.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// @supabase/supabase-js v2.70+ uses a getAll/setAll storage interface.
// The default Node.js in-memory store doesn't implement getAll, causing crashes.
// Provide a compatible in-memory adapter that covers both old and new interfaces.
const _mem = new Map<string, string>();
const nodeStorage = {
  getAll: () => [..._mem.entries()].map(([name, value]) => ({ name, value })),
  setAll: (items: { name: string; value: string }[]) => {
    items.forEach(({ name, value }) => _mem.set(name, value));
  },
  getItem: (key: string) => _mem.get(key) ?? null,
  setItem: (key: string, value: string) => { _mem.set(key, value); },
  removeItem: (key: string) => { _mem.delete(key); },
};

const authConfig = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
  skipAutoInitialize: true,
  storage: nodeStorage,
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: authConfig });

export function createServiceClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, { auth: authConfig });
}
