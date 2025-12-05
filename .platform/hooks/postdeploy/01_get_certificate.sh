#!/usr/bin/env bash
# .platform/hooks/postdeploy/01_get_certificate.sh
# This script runs AFTER deployment to obtain SSL certificate from Let's Encrypt
# It is idempotent - safe to run multiple times

set +e  # Don't exit on error (deployment should not fail if cert acquisition fails)

DOMAIN="rise.is404.net"
EMAIL="zrwaldrip@gmail.com"
CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
CERT_PATH="${CERT_DIR}/fullchain.pem"
KEY_PATH="${CERT_DIR}/privkey.pem"

echo "=== Certificate Acquisition Script ==="
echo "Domain: ${DOMAIN}"

# Check if certbot is available
if ! command -v certbot &> /dev/null; then
    echo "ERROR: Certbot not found. Certificate acquisition skipped."
    echo "Certbot should be installed via .ebextensions/00_install_certbot.config"
    exit 0  # Don't fail deployment
fi

# Check if certificate already exists and is valid
if [ -f "$CERT_PATH" ] && [ -f "$KEY_PATH" ]; then
    echo "Certificate already exists at ${CERT_PATH}"
    
    # Check if certificate is valid (not expired)
    if openssl x509 -in "$CERT_PATH" -noout -checkend 86400 > /dev/null 2>&1; then
        echo "Certificate is valid and not expiring soon."
        echo "Skipping certificate acquisition."
        exit 0
    else
        echo "Certificate exists but is expired or expiring soon. Attempting renewal..."
    fi
fi

# Get the script directory for calling configure script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIGURE_SCRIPT="${SCRIPT_DIR}/02_configure_nginx_ssl.sh"

echo "Attempting to obtain SSL certificate for ${DOMAIN}..."

# Method 1: Try nginx plugin (requires nginx to be running and configured)
if certbot --help all 2>&1 | grep -q "nginx"; then
    echo "Trying nginx plugin method..."
    if certbot certonly \
        --nginx \
        --non-interactive \
        --agree-tos \
        --email "${EMAIL}" \
        -d "${DOMAIN}" \
        --keep-until-expiring \
        2>&1; then
        echo "✅ Certificate obtained successfully using nginx plugin."
        # Configure nginx for SSL
        if [ -f "$CONFIGURE_SCRIPT" ]; then
            bash "$CONFIGURE_SCRIPT"
        fi
        exit 0
    else
        echo "Nginx plugin method failed. Trying standalone mode..."
    fi
fi

# Method 2: Standalone mode (requires stopping nginx temporarily)
echo "Trying standalone mode..."
echo "Note: This will temporarily stop nginx..."

# Stop nginx
if systemctl is-active --quiet nginx; then
    systemctl stop nginx
    NGINX_WAS_RUNNING=true
else
    NGINX_WAS_RUNNING=false
fi

# Get certificate in standalone mode
if certbot certonly \
    --standalone \
    --non-interactive \
    --agree-tos \
    --email "${EMAIL}" \
    -d "${DOMAIN}" \
    --preferred-challenges http \
    --keep-until-expiring \
    2>&1; then
    echo "✅ Certificate obtained successfully using standalone mode."
    
    # Restart nginx
    if [ "$NGINX_WAS_RUNNING" = true ]; then
        systemctl start nginx
    fi
    
    # Configure nginx for SSL
    if [ -f "$CONFIGURE_SCRIPT" ]; then
        bash "$CONFIGURE_SCRIPT"
    fi
    exit 0
else
    echo "⚠️  Certificate acquisition failed in standalone mode."
    
    # Always restart nginx if it was running
    if [ "$NGINX_WAS_RUNNING" = true ]; then
        systemctl start nginx
    fi
fi

echo "⚠️  Could not obtain certificate. This is not critical for deployment."
echo "You can manually run: sudo certbot certonly --standalone -d ${DOMAIN}"
exit 0  # Don't fail deployment

