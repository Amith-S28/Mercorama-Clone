# Fix Plan: Anthropic API Client on Hetzner

## 1. Root Causes

### RC-1 (CRITICAL): Invalid model name
`lib/claude.ts:27` uses `'claude-sonnet-4-20250514'` — this model ID does not exist.
The Anthropic API returns a 404/400 error on every call.
Per CLAUDE.md the correct default is `claude-3-5-haiku-20241022`.

### RC-2 (CRITICAL): ANTHROPIC_API_KEY not available in the PM2 process
`ecosystem.config.js` only injects `NODE_ENV`, `PORT`, and `HOSTNAME` into
the PM2 env block — no Anthropic key, no Stripe keys, no Supabase keys.
Next.js standalone (`server.js`) does NOT auto-load `.env` files at runtime.
So `process.env.ANTHROPIC_API_KEY` is `undefined` in production.

### RC-3 (SECONDARY): No shared config.ts — env vars accessed inline
CLAUDE.md requires all env vars go through `lib/config.ts`. Currently accessed
directly via `process.env.*` throughout the codebase, making misconfiguration
harder to catch.

### RC-4 (SECONDARY): max_tokens set to 4096 by default
CLAUDE.md requires 512–1024 unless the task explicitly needs more.

### RC-5 (SECONDARY): Error handling does not log HTTP status + full response body
The catch block logs the JS Error object but not the raw Anthropic API response
body, making API-level errors opaque in PM2 logs.

### RC-6 (SECONDARY): No `callClaudeHaiku(prompt: string): Promise<string>` export
CLAUDE.md requires this exact interface. Currently the export is
`callClaude(request: ClaudeRequest)` with a system+user object, and the route
file calls `callClaudeWithRetry`. Future code (router, SLM) needs the canonical
single-argument form.

---

## 2. Fix Steps (ordered, minimal, Anthropic-related only)

### Step 1 — Inject ANTHROPIC_API_KEY into PM2 via ecosystem.config.js
Add `ANTHROPIC_API_KEY` (and the other required keys) to the `env` block in
`ecosystem.config.js` so they are available to the Next.js standalone server
process. They are read from the server's `.env` file (not committed to git).

Implementation approach: use `require('dotenv').config()` at the top of
`ecosystem.config.js`, then spread `process.env` into the env block — OR
simply document that keys must be exported as shell env vars before `pm2 start`.

Simplest safe approach: update ecosystem.config.js to load the .env file via
dotenv so the keys are available when PM2 reads the config.

### Step 2 — Create lib/config.ts
Single source of truth for all env var access. Throws at startup if required
vars are missing, so failures are immediate and clear rather than at call time.

### Step 3 — Rewrite lib/claude.ts
- Fix model: `claude-3-5-haiku-20241022`
- Fix max_tokens default: 1024
- Fix error handling: log HTTP status + full Anthropic error body
- Add `callClaudeHaiku(prompt: string): Promise<string>` as the canonical export
- Keep `callClaudeWithRetry` and `ClaudeRequest` interface working (route.ts
  depends on them) — no changes to route.ts in this session

### Step 4 — Update ecosystem.config.js
Add dotenv loading so ANTHROPIC_API_KEY (and other keys) reach the PM2 process.

### Step 5 — Update skills/anthropic-client.md
Document the final working pattern for future sessions.

---

## 3. curl Test — Verify Hetzner Connectivity Before Touching Code

Run this on the Hetzner VPS (replace `$ANTHROPIC_API_KEY` with the actual value
or export it first):

```bash
curl -s https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-haiku-20241022",
    "max_tokens": 32,
    "messages": [{"role": "user", "content": "ping"}]
  }'
```

Expected success: `{"id":"msg_...","type":"message","role":"assistant",...}`
If you see `{"type":"error","error":{"type":"authentication_error",...}}` → key
is wrong or not set.
If you see `curl: (6) Could not resolve host` → DNS/firewall issue on Hetzner.
If you see `{"type":"error","error":{"type":"not_found_error",...}}` → model name
was the only problem (now fixed by RC-1 fix).

---

## 4. Rollback Note

Files changed by this fix plan:
- `lib/config.ts` (new file — delete to revert)
- `lib/claude.ts` (modified — git checkout lib/claude.ts to revert)
- `ecosystem.config.js` (modified — git checkout ecosystem.config.js to revert)
- `skills/anthropic-client.md` (documentation only — no runtime impact)

`app/api/analyze/route.ts` is NOT touched. It continues to call
`callClaudeWithRetry` which delegates to `callClaude` → `callClaudeHaiku`
internally, so no interface change is visible to the route.

If the fix causes a regression, run on Hetzner:
```bash
git checkout lib/claude.ts ecosystem.config.js
rm lib/config.ts
pm2 restart mercorama --update-env
```

---

## Files Changed vs Untouched

| File | Status |
|------|--------|
| `lib/claude.ts` | MODIFIED |
| `lib/config.ts` | NEW |
| `ecosystem.config.js` | MODIFIED |
| `skills/anthropic-client.md` | UPDATED (docs) |
| `app/api/analyze/route.ts` | UNTOUCHED |
| `lib/prompts.ts` | UNTOUCHED |
| `lib/gate.ts` | UNTOUCHED |
| All other files | UNTOUCHED |
