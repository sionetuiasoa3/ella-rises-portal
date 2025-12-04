#!/bin/bash
# Install certbot on Amazon Linux 2023
# This script runs after deployment and installs certbot if not already present
# It will not crash deployment if certbot installation fails temporarily

set -e

echo "Checking for certbot installation..."

# Check if certbot is already installed
if command -v certbot &> /dev/null; then
    echo "Certbot is already installed."
    exit 0
fi

# Try to install certbot
echo "Installing certbot..."

# For Amazon Linux 2023
if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [[ "$ID" == "amzn" ]]; then
        # Amazon Linux 2023 uses dnf
        if command -v dnf &> /dev/null; then
            # Try to install certbot, but don't fail if it's temporarily unavailable
            dnf install -y certbot python3-certbot-nginx 2>&1 || {
                echo "Warning: Certbot installation failed. This is not critical for deployment."
                echo "You can install certbot manually later if needed."
                exit 0
            }
            echo "Certbot installed successfully."
            exit 0
        fi
    fi
fi

# Fallback for Amazon Linux 2 (if needed)
if command -v yum &> /dev/null; then
    yum install -y certbot python3-certbot-nginx 2>&1 || {
        echo "Warning: Certbot installation failed. This is not critical for deployment."
        echo "You can install certbot manually later if needed."
        exit 0
    }
    echo "Certbot installed successfully."
    exit 0
fi

echo "Warning: Could not determine package manager. Certbot not installed."
echo "This is not critical for deployment."
exit 0

