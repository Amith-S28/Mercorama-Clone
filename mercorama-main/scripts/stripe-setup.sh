#!/usr/bin/env bash
# scripts/stripe-setup.sh
# One-time Stripe setup for Freight Connect.
# Creates products, prices, and the Founding Partner coupon.
# Run on Hetzner: bash scripts/stripe-setup.sh
# Requires STRIPE_SECRET_KEY in environment (already set via .env / PM2).

set -euo pipefail

# ── Load .env if present (Hetzner) ─────────────────────────────────────────
if [ -f .env ]; then
  set -o allexport
  source .env
  set +o allexport
fi

if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  echo "ERROR: STRIPE_SECRET_KEY is not set."
  echo "  On Hetzner run: source .env && bash scripts/stripe-setup.sh"
  exit 1
fi

STRIPE="https://api.stripe.com/v1"
AUTH="-u ${STRIPE_SECRET_KEY}:"

echo ""
echo "================================================"
echo "  Mercorama Freight Connect — Stripe Setup"
echo "================================================"
echo ""

# ── Helper: POST to Stripe ────────────────────────────────────────────────────
stripe_post() {
  curl -s $AUTH -X POST "$STRIPE/$1" "${@:2}"
}

stripe_get() {
  curl -s $AUTH "$STRIPE/$1"
}

# ── 1. Create (or reuse) Freight Connect Verified product ───────────────────
echo "Creating product: Freight Connect — Verified..."
VERIFIED_PRODUCT=$(stripe_post products \
  -d "name=Freight Connect — Verified" \
  -d "description=Priority placement, free leads, analytics dashboard" \
  -d "metadata[source]=freight_connect" \
  -d "metadata[tier]=verified")

VERIFIED_PRODUCT_ID=$(echo "$VERIFIED_PRODUCT" | grep -o '"id":"prod_[^"]*"' | head -1 | cut -d'"' -f4)
echo "  → Verified product ID: $VERIFIED_PRODUCT_ID"

# ── 2. Create (or reuse) Freight Connect Featured product ───────────────────
echo "Creating product: Freight Connect — Featured..."
FEATURED_PRODUCT=$(stripe_post products \
  -d "name=Freight Connect — Featured" \
  -d "description=Pinned placement, Mercorama Partner label, free leads" \
  -d "metadata[source]=freight_connect" \
  -d "metadata[tier]=featured")

FEATURED_PRODUCT_ID=$(echo "$FEATURED_PRODUCT" | grep -o '"id":"prod_[^"]*"' | head -1 | cut -d'"' -f4)
echo "  → Featured product ID: $FEATURED_PRODUCT_ID"

# ── 3. Create prices ──────────────────────────────────────────────────────────

echo ""
echo "Creating prices..."

# Verified — monthly ($199 CAD)
VERIFIED_MONTHLY=$(stripe_post prices \
  -d "product=$VERIFIED_PRODUCT_ID" \
  -d "unit_amount=19900" \
  -d "currency=cad" \
  -d "recurring[interval]=month" \
  -d "nickname=Verified Monthly" \
  -d "metadata[tier]=verified" \
  -d "metadata[billing_period]=monthly")
VERIFIED_MONTHLY_ID=$(echo "$VERIFIED_MONTHLY" | grep -o '"id":"price_[^"]*"' | head -1 | cut -d'"' -f4)
echo "  → STRIPE_PRICE_VERIFIED_MONTHLY: $VERIFIED_MONTHLY_ID"

# Verified — annual ($1,990 CAD)
VERIFIED_ANNUAL=$(stripe_post prices \
  -d "product=$VERIFIED_PRODUCT_ID" \
  -d "unit_amount=199000" \
  -d "currency=cad" \
  -d "recurring[interval]=year" \
  -d "nickname=Verified Annual" \
  -d "metadata[tier]=verified" \
  -d "metadata[billing_period]=annual")
VERIFIED_ANNUAL_ID=$(echo "$VERIFIED_ANNUAL" | grep -o '"id":"price_[^"]*"' | head -1 | cut -d'"' -f4)
echo "  → STRIPE_PRICE_VERIFIED_ANNUAL:  $VERIFIED_ANNUAL_ID"

# Featured — monthly ($349 CAD)
FEATURED_MONTHLY=$(stripe_post prices \
  -d "product=$FEATURED_PRODUCT_ID" \
  -d "unit_amount=34900" \
  -d "currency=cad" \
  -d "recurring[interval]=month" \
  -d "nickname=Featured Monthly" \
  -d "metadata[tier]=featured" \
  -d "metadata[billing_period]=monthly")
FEATURED_MONTHLY_ID=$(echo "$FEATURED_MONTHLY" | grep -o '"id":"price_[^"]*"' | head -1 | cut -d'"' -f4)
echo "  → STRIPE_PRICE_FEATURED_MONTHLY: $FEATURED_MONTHLY_ID"

# Featured — annual ($3,490 CAD)
FEATURED_ANNUAL=$(stripe_post prices \
  -d "product=$FEATURED_PRODUCT_ID" \
  -d "unit_amount=349000" \
  -d "currency=cad" \
  -d "recurring[interval]=year" \
  -d "nickname=Featured Annual" \
  -d "metadata[tier]=featured" \
  -d "metadata[billing_period]=annual")
FEATURED_ANNUAL_ID=$(echo "$FEATURED_ANNUAL" | grep -o '"id":"price_[^"]*"' | head -1 | cut -d'"' -f4)
echo "  → STRIPE_PRICE_FEATURED_ANNUAL:  $FEATURED_ANNUAL_ID"

# ── 4. Create Founding Partner coupon (25% off — 3 free months on annual) ───
echo ""
echo "Creating Founding Partner coupon (25% off, max 20 redemptions)..."
COUPON=$(stripe_post coupons \
  -d "percent_off=25" \
  -d "duration=once" \
  -d "name=Founding Partner — 3 Months Free" \
  -d "max_redemptions=20" \
  -d "metadata[source]=freight_connect_founding")
COUPON_ID=$(echo "$COUPON" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  → STRIPE_COUPON_FOUNDING_PARTNER: $COUPON_ID"

# ── 5. Print .env block ───────────────────────────────────────────────────────
echo ""
echo "================================================"
echo "  Add these lines to your .env on Hetzner:"
echo "================================================"
echo ""
echo "STRIPE_PRICE_VERIFIED_MONTHLY=$VERIFIED_MONTHLY_ID"
echo "STRIPE_PRICE_VERIFIED_ANNUAL=$VERIFIED_ANNUAL_ID"
echo "STRIPE_PRICE_FEATURED_MONTHLY=$FEATURED_MONTHLY_ID"
echo "STRIPE_PRICE_FEATURED_ANNUAL=$FEATURED_ANNUAL_ID"
echo "STRIPE_COUPON_FOUNDING_PARTNER=$COUPON_ID"
echo ""
echo "Then restart PM2:  pm2 restart mercorama"
echo ""
echo "================================================"
echo "  Stripe Webhook (manual step)"
echo "================================================"
echo ""
echo "In Stripe Dashboard → Developers → Webhooks → Add endpoint:"
echo "  URL:    https://mercorama.com/api/freight-connect/stripe/webhook"
echo "  Events: checkout.session.completed"
echo "          customer.subscription.updated"
echo "          customer.subscription.deleted"
echo "          invoice.payment_failed"
echo ""
echo "Copy the webhook signing secret and set:"
echo "  STRIPE_WEBHOOK_SECRET=whsec_..."
echo "  (already in .env — update if this is a new endpoint)"
echo ""
echo "Done."
