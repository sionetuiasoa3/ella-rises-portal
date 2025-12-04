#!/bin/bash
# Script to create deployment ZIP for AWS Elastic Beanstalk
# This excludes all unnecessary files and creates a clean deployment package

echo "Creating deployment ZIP for AWS Elastic Beanstalk..."

# Remove old ZIP if it exists
if [ -f "ella-rises-portal.zip" ]; then
    echo "Removing old ZIP file..."
    rm ella-rises-portal.zip
fi

# Create ZIP with exclusions
zip -r ella-rises-portal.zip . \
  -x "node_modules/*" \
  -x "src/*" \
  -x ".env*" \
  -x ".git/*" \
  -x "*.log" \
  -x ".DS_Store" \
  -x "bun.lockb" \
  -x "components.json" \
  -x "eslint.config.js" \
  -x "index.html" \
  -x "postcss.config.js" \
  -x "tailwind.config.ts" \
  -x "tsconfig*.json" \
  -x "vite.config.ts" \
  -x ".cursor/*" \
  -x "DEPLOYMENT_CHECKLIST.md" \
  -x "create-deployment-zip.sh" \
  > /dev/null

echo "✅ Deployment ZIP created: ella-rises-portal.zip"
echo ""
echo "Files included:"
unzip -l ella-rises-portal.zip | head -20
echo "..."
echo ""
echo "Total files: $(unzip -l ella-rises-portal.zip | tail -1 | awk '{print $2}')"
echo ""
echo "Ready for upload to AWS Elastic Beanstalk!"

