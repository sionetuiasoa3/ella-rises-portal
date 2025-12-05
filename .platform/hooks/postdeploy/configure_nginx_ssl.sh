#!/usr/bin/env bash
# .platform/hooks/postdeploy/configure_nginx_ssl.sh
# Configure nginx to use SSL certificate

set +e  # Don't exit on error

CERT_PATH="/etc/letsencrypt/live/rise.is404.net/fullchain.pem"
KEY_PATH="/etc/letsencrypt/live/rise.is404.net/privkey.pem"

# Check if certificate exists
if [ ! -f "$CERT_PATH" ] || [ ! -f "$KEY_PATH" ]; then
    echo "SSL certificate files not found. Skipping nginx SSL configuration."
    exit 0
fi

echo "Configuring nginx for SSL..."

# Find the main nginx config file (usually in /etc/nginx/nginx.conf)
NGINX_CONF="/etc/nginx/nginx.conf"
if [ ! -f "$NGINX_CONF" ]; then
    echo "Nginx config file not found at $NGINX_CONF"
    exit 0
fi

# Create a custom server block configuration
CUSTOM_CONF="/etc/nginx/conf.d/ssl.conf"
sudo tee "$CUSTOM_CONF" > /dev/null <<EOF
# SSL Configuration for rise.is404.net
# HTTP server - redirect to HTTPS
server {
    listen 80;
    server_name rise.is404.net;
    
    # Redirect all HTTP traffic to HTTPS
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name rise.is404.net;
    
    # SSL certificate configuration
    ssl_certificate $CERT_PATH;
    ssl_certificate_key $KEY_PATH;
    
    # SSL configuration - modern, secure settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy settings
    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Increase body size limit for file uploads
    client_max_body_size 10M;
}
EOF

# Test nginx configuration
if sudo nginx -t; then
    echo "Nginx configuration test passed. Reloading nginx..."
    sudo systemctl reload nginx
    echo "Nginx SSL configuration completed successfully."
else
    echo "Nginx configuration test failed. Not reloading."
    exit 0
fi

exit 0

