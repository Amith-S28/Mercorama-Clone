# skills/anthropic-client.md
# Anthropic SDK — Mercorama working patterns

## Canonical model
```
claude-haiku-4-5-20251001   ← default (Haiku 4.5)
claude-sonnet-4-5-20251001  ← complex tasks only (Sonnet 4.5)
```
Use Sonnet only for Country Intelligence Layer 2/3 (see CLAUDE.md).
Never use Opus.

## Canonical function signature
```typescript
// lib/claude.ts
callClaudeHaiku(prompt: string): Promise<string>
```
Single string in, single string out. No system prompt argument.
For structured system+user calls use the legacy `ClaudeRequest` interface (see below).

## max_tokens default
```typescript
const DEFAULT_MAX_TOKENS = 1024;
```
Do not exceed 1024 unless the task explicitly requires it.
Do not enable streaming.

## Env var — source via config.ts only
```typescript
// lib/config.ts
export const config = {
  anthropicApiKey: requireEnv('ANTHROPIC_API_KEY'),
  ...
};

// lib/claude.ts
import { config } from '@/lib/config';
new Anthropic({ apiKey: config.anthropicApiKey });
```
Never access `process.env.ANTHROPIC_API_KEY` directly in any file.
On Hetzner, `ANTHROPIC_API_KEY` is set in `.env` and loaded into PM2 via
`ecosystem.config.js` (which parses `.env` using Node `fs` — no dotenv dep).

## Error logging pattern
```typescript
} catch (error) {
  if (error instanceof Anthropic.APIError) {
    console.error(
      `[mercorama] Anthropic API error — status: ${error.status} body:`,
      JSON.stringify(error.error ?? error.message)
    );
  } else {
    console.error('[mercorama] Unexpected error calling Anthropic:', error);
  }
  throw error;
}
```
Always log: HTTP status code + full `error.error` body. Re-throw — never swallow.

## Legacy interface (do not break)
`app/api/analyze/route.ts` calls `callClaudeWithRetry(prompt, ClaudeRequest)`.
Both `callClaudeWithRetry` and `ClaudeRequest` are preserved in `lib/claude.ts`.
Do not rename or remove them.

```typescript
export interface ClaudeRequest {
  system: string;
  user: string;
  maxTokens?: number;
}
export async function callClaudeWithRetry(
  request: ClaudeRequest,
  maxRetries: number = 2
): Promise<string>
```

## Connectivity test — run on Hetzner VPS before debugging code
```bash
curl -X POST https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-haiku-4-5-20251001","max_tokens":64,"messages":[{"role":"user","content":"ping"}]}'
```
- Success: `{"id":"msg_...","type":"message","role":"assistant",...}`
- `authentication_error` → key missing or wrong
- `not_found_error` → wrong model name
- `Could not resolve host` → DNS/firewall issue on Hetzner

## Files
| File | Role |
|------|------|
| `lib/claude.ts` | SDK client, all call functions |
| `lib/config.ts` | Single env var source — import here, nowhere else |
| `ecosystem.config.js` | Loads `.env` into PM2 process at startup |
