#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# ssl-setup.sh — Get Let's Encrypt cert and wire it into EasyEngine nginx-proxy
#
# Prerequisites:
#   - DNS A record for mercorama.com and www.mercorama.com → this server's IP
#   - nginx.conf already placed in conf.d and nginx-proxy reloaded (HTTP working)
#   - certbot installed (via snap)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DOMAIN="mercorama.com"
EMAIL="admin@mercorama.com"
WEBROOT="/var/lib/docker/volumes/global-nginx-proxy_html/_data"
CERTS_VOLUME="/var/lib/docker/volumes/global-nginx-proxy_certs/_data"
NGINX_CONTAINER="services_global-nginx-proxy_1"

echo "▶ [1/4] Requesting SSL certificate via webroot challenge..."
certbot certonly \
  --webroot \
  -w "$WEBROOT" \
  -d "$DOMAIN" \
  -d "www.$DOMAIN" \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL"

echo "▶ [2/4] Copying certs into EasyEngine proxy certs volume..."
# Must copy (not symlink) — Docker container cannot follow host symlinks
rm -f "$CERTS_VOLUME/$DOMAIN.crt" "$CERTS_VOLUME/$DOMAIN.key"
cp -L "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$CERTS_VOLUME/$DOMAIN.crt"
cp -L "/etc/letsencrypt/live/$DOMAIN/privkey.pem"   "$CERTS_VOLUME/$DOMAIN.key"

echo "▶ [3/4] Reloading nginx-proxy..."
docker exec "$NGINX_CONTAINER" nginx -s reload

echo "▶ [4/4] Installing renewal deploy hook..."
cat > /etc/letsencrypt/renewal-hooks/deploy/mercorama-reload.sh << 'HOOK'
#!/usr/bin/env bash
DOMAIN="mercorama.com"
CERTS_VOLUME="/var/lib/docker/volumes/global-nginx-proxy_certs/_data"
rm -f "$CERTS_VOLUME/$DOMAIN.crt" "$CERTS_VOLUME/$DOMAIN.key"
cp -L "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$CERTS_VOLUME/$DOMAIN.crt"
cp -L "/etc/letsencrypt/live/$DOMAIN/privkey.pem"   "$CERTS_VOLUME/$DOMAIN.key"
docker exec services_global-nginx-proxy_1 nginx -s reload
HOOK
chmod +x /etc/letsencrypt/renewal-hooks/deploy/mercorama-reload.sh

echo ""
echo "✅ SSL configured for $DOMAIN"
echo "   Test renewal: certbot renew --dry-run"
