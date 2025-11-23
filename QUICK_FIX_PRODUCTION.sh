#!/bin/bash

#######################################################################
# QUICK FIX FOR PRODUCTION BACKEND CRASH
# 
# Fixes:
# 1. Install missing @sentry/node (or make it optional)
# 2. Install missing express-pino-logger
# 3. Restart backend
#######################################################################

set -e

echo "=================================================="
echo "🔧 QUICK FIX: Production Backend Crash"
echo "=================================================="
echo ""

cd /var/www/jjtextiles-ecom/backend

echo "STEP 1: Installing missing dependencies..."
echo "----------------------------------------"
npm install express-pino-logger@^7.0.0

# Option: Install Sentry (optional - comment out if you don't want it)
echo ""
echo "Installing @sentry/node (optional - for error monitoring)..."
npm install @sentry/node || echo "⚠️  Sentry installation failed, but server will work without it"

echo ""
echo "STEP 2: Installing all dependencies..."
npm install

echo ""
echo "STEP 3: Restarting backend..."
pm2 restart jjtextiles-backend

echo ""
echo "STEP 4: Waiting for backend to start..."
sleep 5

echo ""
echo "STEP 5: Checking backend status..."
pm2 status jjtextiles-backend

echo ""
echo "STEP 6: Recent logs..."
pm2 logs jjtextiles-backend --lines 20 --nostream

echo ""
echo "=================================================="
echo "✅ Fix Complete!"
echo "=================================================="
echo ""
echo "If backend is still crashing, check:"
echo "1. pm2 logs jjtextiles-backend --err"
echo "2. Ensure MongoDB is running"
echo "3. Check .env file exists and has correct values"
echo ""

