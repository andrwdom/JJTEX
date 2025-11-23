# 🚨 CRITICAL PRODUCTION FIX - Backend Crashing

## Immediate Issue
Backend is crashing with: `Cannot find package '@sentry/node'`

## Root Cause
The server.js file imports `@sentry/node` but it's not installed in production.

## Quick Fix (Run on Production Server)

```bash
cd /var/www/jjtextiles-ecom/backend

# Option 1: Install Sentry (if you want error monitoring)
npm install @sentry/node

# Option 2: Make Sentry optional (recommended - server will work without it)
# The code has been updated to handle missing Sentry gracefully
# Just pull the latest code and restart

# Install all missing dependencies
npm install express-pino-logger @sentry/node

# Restart backend
pm2 restart jjtextiles-backend

# Check status
pm2 logs jjtextiles-backend --lines 30
```

## Files That Need to be Deployed

1. `backend/server.js` - Updated to make Sentry optional
2. `backend/models/Category.js` - Fixed duplicate index warning
3. `backend/package.json` - Added express-pino-logger

## Verification

After deployment, check:
```bash
# Backend should start without errors
pm2 logs jjtextiles-backend --lines 20

# Should see:
# ✅ Server started on port 4000
# ⚠️ Sentry not available (optional dependency) - if Sentry not installed
# ✅ MongoDB connected

# Test health endpoint
curl http://localhost:4000/api/health
```

## If You Don't Want Sentry

The code now handles missing Sentry gracefully. You can either:
1. Install it: `npm install @sentry/node`
2. Leave it uninstalled - server will work fine without it

