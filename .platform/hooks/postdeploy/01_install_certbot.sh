#!/bin/bash
# .platform/hooks/postdeploy/01_install_certbot.sh
# Install certbot if not already installed
# This script runs after each deployment

if ! command -v certbot >/dev/null 2>&1; then
  yum install -y epel-release
  yum install -y certbot
fi

