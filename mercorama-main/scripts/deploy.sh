#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — Pull latest code, build, and restart Mercorama
# Run from /var/www/mercorama or pass APP_DIR as env var
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/mercorama}"
cd "$APP_DIR"

echo "▶ [1/5] Pulling latest code..."
git pull origin main

echo "▶ [2/5] Installing dependencies..."
pnpm install --frozen-lockfile

echo "▶ [3/5] Building Next.js (standalone)..."
pnpm build

echo "▶ [4/5] Copying static assets into standalone output..."
cp -r public  .next/standalone/
cp -r .next/static .next/standalone/.next/static

echo "▶ [5/5] Restarting PM2 process..."
if pm2 list | grep -q 'mercorama'; then
  pm2 restart mercorama --update-env
else
  pm2 start ecosystem.config.js
fi
pm2 save

echo ""
echo "✅ Mercorama deployed successfully."
pm2 list
