#!/bin/bash
# .platform/hooks/postdeploy/02_get_cert.sh
# Obtain SSL certificate from Let's Encrypt using webroot method
# This script runs after each deployment

DOMAIN="rise.is404.net"
EMAIL="zachwaldrip@gmail.com"

if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  certbot certonly --non-interactive --agree-tos \
    --email "$EMAIL" \
    --webroot -w /var/app/current/public \
    -d "$DOMAIN"
  systemctl restart nginx
else
  echo "SSL certificate already exists, skipping certbot request."
fi

