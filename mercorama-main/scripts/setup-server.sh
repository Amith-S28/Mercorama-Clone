#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# setup-server.sh — One-time bootstrap for Mercorama on Ubuntu 22.04 VPS
# Run as root: bash scripts/setup-server.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

echo "▶ [1/8] Updating system packages..."
apt-get update -y && apt-get upgrade -y

echo "▶ [2/8] Installing Node.js 20 (NodeSource)..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "▶ [3/8] Installing pnpm..."
npm install -g pnpm

echo "▶ [4/8] Installing PM2..."
npm install -g pm2
pm2 startup systemd -u root --hp /root | tail -1 | bash

echo "▶ [5/8] Installing Nginx..."
apt-get install -y nginx
systemctl enable nginx

echo "▶ [6/8] Installing Certbot via snap..."
snap install --classic certbot
ln -sf /snap/bin/certbot /usr/bin/certbot

echo "▶ [7/8] Configuring firewall (ufw)..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "▶ [8/8] Creating app directory..."
mkdir -p /var/www/mercorama

echo ""
echo "✅ Server bootstrap complete."
echo ""
echo "Next steps:"
echo "  1. Push your code to a git repo and clone it into /var/www/mercorama"
echo "     OR rsync from your local machine:"
echo "     rsync -avz --exclude=node_modules --exclude=.next ./ root@178.104.2.206:/var/www/mercorama/"
echo ""
echo "  2. Copy and fill in your environment variables:"
echo "     cp /var/www/mercorama/.env.example /var/www/mercorama/.env"
echo "     nano /var/www/mercorama/.env"
echo ""
echo "  3. Copy the Nginx config and set up SSL:"
echo "     cp /var/www/mercorama/scripts/nginx.conf /etc/nginx/sites-available/mercorama"
echo "     ln -s /etc/nginx/sites-available/mercorama /etc/nginx/sites-enabled/"
echo "     nginx -t && systemctl reload nginx"
echo "     bash /var/www/mercorama/scripts/ssl-setup.sh"
echo ""
echo "  4. Deploy the app:"
echo "     bash /var/www/mercorama/scripts/deploy.sh"
