#!/usr/bin/env bash
# .platform/hooks/postdeploy/00_get_certificate.sh

# Try to get certificate, but don't fail deployment if it fails
# First try with nginx plugin, then fall back to standalone mode

set +e  # Don't exit on error

# Check if certbot is available
if ! command -v certbot &> /dev/null; then
    echo "Certbot not found. Skipping certificate acquisition."
    exit 0
fi

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIGURE_SCRIPT="$SCRIPT_DIR/configure_nginx_ssl.sh"

# Check if certificate already exists
if [ -f /etc/letsencrypt/live/rise.is404.net/fullchain.pem ]; then
    echo "Certificate already exists. Configuring nginx for SSL..."
    # Configure nginx for SSL
    if [ -f "$CONFIGURE_SCRIPT" ]; then
        bash "$CONFIGURE_SCRIPT"
    fi
    exit 0
fi

# Try nginx plugin first (if available)
if certbot --help all 2>&1 | grep -q "nginx"; then
    echo "Attempting to get certificate using nginx plugin..."
    sudo certbot -n -d rise.is404.net --nginx --agree-tos --email zrwaldrip@gmail.com || {
        echo "Nginx plugin failed, trying standalone mode..."
        # Stop nginx temporarily for standalone mode
        sudo systemctl stop nginx
        sudo certbot certonly --standalone -n -d rise.is404.net --agree-tos --email zrwaldrip@gmail.com --preferred-challenges http
        sudo systemctl start nginx
        # Configure nginx for SSL after getting certificate
        if [ -f "$CONFIGURE_SCRIPT" ]; then
            bash "$CONFIGURE_SCRIPT"
        fi
    }
else
    echo "Nginx plugin not available, using standalone mode..."
    # Stop nginx temporarily for standalone mode
    sudo systemctl stop nginx
    sudo certbot certonly --standalone -n -d rise.is404.net --agree-tos --email zrwaldrip@gmail.com --preferred-challenges http
    sudo systemctl start nginx
    # Configure nginx for SSL after getting certificate
    if [ -f "$CONFIGURE_SCRIPT" ]; then
        bash "$CONFIGURE_SCRIPT"
    fi
fi

# Always exit successfully to not fail deployment
exit 0

