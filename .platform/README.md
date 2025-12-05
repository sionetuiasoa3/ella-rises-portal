# Elastic Beanstalk Platform Hooks

This directory contains platform hooks that run automatically after each deployment.

## Structure

```
.platform/
├── hooks/
│   └── postdeploy/
│       ├── 01_install_certbot.sh  # Installs certbot if not present
│       └── 02_get_cert.sh         # Obtains SSL certificate from Let's Encrypt
└── nginx/
    └── conf.d/
        └── ssl.conf                # Nginx SSL configuration
```

## How It Works

1. **After each deployment**, Elastic Beanstalk runs scripts in `.platform/hooks/postdeploy/` in alphabetical order.

2. **01_install_certbot.sh**: 
   - Checks if certbot is installed
   - If not, installs epel-release and certbot using yum
   - Runs on every deployment (idempotent)

3. **02_get_cert.sh**:
   - Checks if SSL certificate already exists
   - If not, requests certificate from Let's Encrypt using webroot method
   - Uses `/var/app/current/public` as webroot (EB's public directory)
   - Restarts nginx after certificate acquisition
   - Skips if certificate already exists (idempotent)

4. **nginx/conf.d/ssl.conf**:
   - Automatically included by EB's default nginx configuration
   - Configures HTTPS on port 443
   - Redirects HTTP (port 80) to HTTPS
   - Proxies requests to Node.js app on port 8081

## Requirements

- Domain `rise.is404.net` must point to the EB environment
- Port 80 must be open in the security group (for HTTP-01 challenge)
- Port 443 must be open in the security group (for HTTPS)
- The public directory must be accessible via HTTP for ACME validation

## Notes

- Scripts are executable and have proper shebangs (`#!/bin/bash`)
- Scripts run as root in the postdeploy phase
- Files in `.platform/` are preserved across deployments
- Nginx config in `.platform/nginx/conf.d/` is automatically included

