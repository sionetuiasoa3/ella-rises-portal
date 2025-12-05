# HTTPS Setup Fix for AWS Elastic Beanstalk

## 🔍 What Was Wrong

### 1. **Hook Execution Order Issue**
- **Problem**: `00_get_certificate.sh` ran before `01_install_certbot.sh` (alphabetical order)
- **Impact**: Certificate acquisition attempted before certbot was installed, causing failures
- **Fix**: Renamed hooks to `01_get_certificate.sh` and `02_configure_nginx_ssl.sh` for proper ordering

### 2. **Duplicate Certbot Installation**
- **Problem**: Certbot was being installed in both `.ebextensions` (container_commands) and `.platform/hooks/postdeploy`
- **Impact**: Race conditions, inconsistent installation methods, potential conflicts
- **Fix**: Removed installation from hooks, kept only in `.ebextensions` which runs earlier and more reliably

### 3. **Amazon Linux Version Compatibility**
- **Problem**: `.ebextensions/00_install_certbot.config` only handled Amazon Linux 2023 (dnf), not AL2 (yum)
- **Impact**: Certbot installation would fail on AL2 instances
- **Fix**: Added OS detection and support for both AL2 (yum) and AL2023 (dnf)

### 4. **Nginx Configuration Conflicts**
- **Problem**: The old `configure_nginx_ssl.sh` created `/etc/nginx/conf.d/ssl.conf` which might conflict with EB's default config
- **Impact**: Nginx config test failures, SSL not working properly
- **Fix**: Created properly named config file (`ssl_rise.is404.net.conf`) that works with EB's default nginx.conf include pattern

### 5. **Missing Idempotency**
- **Problem**: Scripts didn't check if certificates/configs already existed
- **Impact**: Errors on redeployments, unnecessary certificate requests
- **Fix**: Added checks for existing certificates and configs, making all scripts idempotent

### 6. **Error Handling**
- **Problem**: Some scripts used `set -e` which would fail deployment on any error
- **Impact**: Deployment failures when certbot was temporarily unavailable
- **Fix**: Used `set +e` in postdeploy hooks and proper error handling to prevent deployment failures

### 7. **Certificate Renewal**
- **Problem**: Renewal cron job didn't handle nginx reload failures gracefully
- **Impact**: Renewal failures could break the site
- **Fix**: Added `|| true` to prevent cron job failures from affecting the system

## ✅ Files Modified/Created

### Modified Files:

1. **`.ebextensions/00_install_certbot.config`**
   - Added OS detection (Amazon Linux 2 vs 2023)
   - Made installation idempotent (checks if certbot already exists)
   - Handles both `yum` (AL2) and `dnf` (AL2023) package managers

2. **`.ebextensions/02_certbot_renewal.config`**
   - Added error handling to renewal cron job
   - Added comments explaining the renewal schedule

### Created Files:

3. **`.platform/hooks/postdeploy/01_get_certificate.sh`** (NEW)
   - Replaces old `00_get_certificate.sh`
   - Checks if certificate already exists and is valid
   - Tries nginx plugin first, falls back to standalone mode
   - Idempotent - safe to run multiple times
   - Calls `02_configure_nginx_ssl.sh` after certificate acquisition

4. **`.platform/hooks/postdeploy/02_configure_nginx_ssl.sh`** (NEW)
   - Replaces old `configure_nginx_ssl.sh`
   - Creates nginx config in `/etc/nginx/conf.d/ssl_rise.is404.net.conf`
   - Includes HTTP→HTTPS redirect
   - Includes ACME challenge location for certificate renewal
   - Modern SSL/TLS configuration with security headers
   - Idempotent - safe to run multiple times

### Deleted Files:

5. **`.platform/hooks/postdeploy/00_get_certificate.sh`** (DELETED - wrong order)
6. **`.platform/hooks/postdeploy/01_install_certbot.sh`** (DELETED - duplicate)
7. **`.platform/hooks/postdeploy/configure_nginx_ssl.sh`** (DELETED - replaced)

## 📋 How HTTPS is Now Configured

### Execution Flow:

1. **During Deployment (`.ebextensions`)**:
   - `00_install_certbot.config` installs certbot (AL2 or AL2023 compatible)
   - `10_open_https_port.config` opens port 443 in security group
   - `02_certbot_renewal.config` sets up automatic renewal cron job

2. **After Deployment (`.platform/hooks/postdeploy`)**:
   - `01_get_certificate.sh`:
     - Checks if certbot is installed
     - Checks if certificate already exists and is valid
     - Attempts to obtain certificate (nginx plugin → standalone fallback)
     - Calls `02_configure_nginx_ssl.sh` on success
   
   - `02_configure_nginx_ssl.sh`:
     - Verifies certificate files exist
     - Creates nginx SSL config in `/etc/nginx/conf.d/`
     - Tests nginx configuration
     - Reloads nginx gracefully

### Certificate Source:
- **Let's Encrypt** via Certbot
- Obtained using HTTP-01 challenge (port 80)
- Stored in `/etc/letsencrypt/live/rise.is404.net/`

### Nginx Configuration:
- Config file: `/etc/nginx/conf.d/ssl_rise.is404.net.conf`
- Automatically included by EB's default nginx.conf
- HTTP (port 80) → redirects to HTTPS (port 443)
- HTTPS (port 443) → proxies to Node.js app on port 8081

## 🚀 Deployment Steps

1. **Create deployment ZIP** (includes all fixed files):
   ```bash
   ./create-deployment-zip.sh
   ```

2. **Upload to AWS Elastic Beanstalk**:
   - Go to EB Console → Your Environment
   - Click "Upload and Deploy"
   - Select `ella-rises-portal.zip`
   - Deploy

3. **Monitor Deployment**:
   - Check deployment logs for certbot installation
   - Check postdeploy logs for certificate acquisition
   - Verify nginx configuration test passes

4. **Verify HTTPS**:
   - Wait 2-3 minutes after deployment completes
   - Visit `https://rise.is404.net`
   - Should redirect from HTTP to HTTPS automatically

## ⚠️ Manual Steps (If Needed)

### First-Time Certificate Acquisition

If certificate acquisition fails during deployment (e.g., DNS not fully propagated), you can manually obtain it:

1. **SSH into the EB instance**:
   ```bash
   eb ssh
   ```

2. **Run certificate acquisition manually**:
   ```bash
   sudo certbot certonly --standalone -d rise.is404.net --non-interactive --agree-tos --email zrwaldrip@gmail.com
   ```

3. **Configure nginx**:
   ```bash
   sudo /var/app/current/.platform/hooks/postdeploy/02_configure_nginx_ssl.sh
   ```

### Troubleshooting

**Certificate not obtained:**
- Check DNS: `nslookup rise.is404.net` should resolve to EB instance
- Check port 80: Security group must allow inbound on port 80
- Check logs: `/var/log/eb-hooks.log` and `/var/log/certbot.log`

**Nginx config test fails:**
- Check certificate paths: `ls -la /etc/letsencrypt/live/rise.is404.net/`
- Check nginx syntax: `sudo nginx -t`
- Check EB logs: `/var/log/eb-engine.log`

**HTTPS not working:**
- Verify certificate exists: `sudo certbot certificates`
- Check nginx is running: `sudo systemctl status nginx`
- Check port 443 is open: Security group must allow inbound on port 443
- Check nginx config: `sudo cat /etc/nginx/conf.d/ssl_rise.is404.net.conf`

## 🔒 Security Features

- **Modern TLS**: TLSv1.2 and TLSv1.3 only
- **Strong Ciphers**: ECDHE ciphers with perfect forward secrecy
- **Security Headers**: HSTS, X-Frame-Options, X-Content-Type-Options, etc.
- **OCSP Stapling**: Enabled for faster certificate validation
- **Automatic Renewal**: Certificates renewed automatically before expiration

## 📝 Notes

- All scripts are **idempotent** - safe to run multiple times
- Deployment will **not fail** if certificate acquisition fails (but HTTPS won't work)
- Certificates are **automatically renewed** via cron job
- Nginx config is **compatible** with EB's default configuration
- Works on both **Amazon Linux 2** and **Amazon Linux 2023**

## ✅ Verification Checklist

After deployment, verify:

- [ ] Certbot is installed: `certbot --version`
- [ ] Certificate exists: `sudo certbot certificates`
- [ ] Nginx config exists: `ls -la /etc/nginx/conf.d/ssl_rise.is404.net.conf`
- [ ] Nginx test passes: `sudo nginx -t`
- [ ] HTTP redirects to HTTPS: `curl -I http://rise.is404.net`
- [ ] HTTPS works: `curl -I https://rise.is404.net`
- [ ] Browser shows valid certificate (green lock icon)

