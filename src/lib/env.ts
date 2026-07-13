import { z } from 'zod';

const optionalKey = z
  .string()
  .optional()
  .transform((v) => v ?? '');

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: optionalKey,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalKey,
  SUPABASE_SERVICE_ROLE_KEY: optionalKey,
  GEMINI_API_KEY: optionalKey,
  COMTRADE_API_KEY: optionalKey,
  EXCHANGE_RATE_API_KEY: optionalKey,
  CSL_API_KEY: optionalKey,
  WTO_API_KEY: optionalKey,
  MOCK_ADVISOR_ID: z
    .string()
    .uuid()
    .optional()
    .transform((v) => v ?? '00000000-0000-0000-0000-000000000001'),
});

export type AppEnv = z.infer<typeof envSchema>;

function loadEnv(): AppEnv {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    COMTRADE_API_KEY: process.env.COMTRADE_API_KEY,
    EXCHANGE_RATE_API_KEY: process.env.EXCHANGE_RATE_API_KEY,
    CSL_API_KEY: process.env.CSL_API_KEY,
    WTO_API_KEY: process.env.WTO_API_KEY,
    MOCK_ADVISOR_ID: process.env.MOCK_ADVISOR_ID,
  });

  if (!parsed.success) {
    return {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? '',
      COMTRADE_API_KEY: process.env.COMTRADE_API_KEY ?? '',
      EXCHANGE_RATE_API_KEY: process.env.EXCHANGE_RATE_API_KEY ?? '',
      CSL_API_KEY: process.env.CSL_API_KEY ?? '',
      WTO_API_KEY: process.env.WTO_API_KEY ?? '',
      MOCK_ADVISOR_ID: '00000000-0000-0000-0000-000000000001',
    };
  }

  return parsed.data;
}

export const env = loadEnv();

export function isSupabaseConfigured(): boolean {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function isServiceConfigured(service: keyof AppEnv): boolean {
  const value = env[service];
  return typeof value === 'string' && value.length > 0;
}
