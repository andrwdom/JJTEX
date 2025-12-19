#!/bin/bash
# Fix Server Dependencies Script
# Run this on your VPS to fix missing dependencies and clean up lockfiles

set -e

echo "🔧 Fixing server dependencies and cleaning up..."

# Navigate to project root
cd /var/www/jjtextiles-ecom

# 1. Remove pnpm-lock.yaml from frontend (causes Next.js warnings)
if [ -f "frontend/pnpm-lock.yaml" ]; then
    echo "📦 Removing pnpm-lock.yaml from frontend..."
    rm -f frontend/pnpm-lock.yaml
    echo "✅ Removed pnpm-lock.yaml"
else
    echo "ℹ️  pnpm-lock.yaml not found (already removed)"
fi

# 2. Install backend dependencies (fixes rotating-file-stream and @sentry/node)
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm ci --production=false
echo "✅ Backend dependencies installed"

# 3. Verify critical packages are installed
echo ""
echo "🔍 Verifying critical packages..."
if npm list rotating-file-stream > /dev/null 2>&1; then
    echo "✅ rotating-file-stream is installed"
else
    echo "❌ rotating-file-stream is missing - installing..."
    npm install rotating-file-stream@^3.2.7
fi

if npm list @sentry/node > /dev/null 2>&1; then
    echo "✅ @sentry/node is installed"
else
    echo "❌ @sentry/node is missing - installing..."
    npm install @sentry/node@^8.0.0
fi

# 4. Return to project root
cd ..

# 5. Restart PM2 processes
echo ""
echo "🔄 Restarting PM2 processes..."
pm2 restart all

echo ""
echo "✅ All fixes applied! Check PM2 logs with: pm2 logs"

