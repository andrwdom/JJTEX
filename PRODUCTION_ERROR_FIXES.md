# Production Error Fixes

## Issues Identified from Production Logs

### 1. MODULE_NOT_FOUND Error ⚠️
**Error**: `MODULE_NOT_FOUND` in `/var/www/jjtextiles-ecom/backend/server.js`

**Root Cause**: The `express-pino-logger` package might not be installed in production.

**Solution**: 
1. SSH into production server
2. Navigate to backend directory: `cd /var/www/jjtextiles-ecom/backend`
3. Install missing dependency: `npm install express-pino-logger`
4. Restart PM2: `pm2 restart jjtextiles-backend`

### 2. Duplicate Schema Index Warning ✅ FIXED
**Error**: 
```
Warning: Duplicate schema index on {"slug":1} found. This is often due to declaring an index using both "index: true" and "schema.index()".
```

**Root Cause**: Mongoose was auto-creating an index on `slug` field, conflicting with the compound index `{ slug: 1, parent: 1 }`.

**Fix Applied**: 
- Added `index: false` to the `slug` field definition to prevent auto-indexing
- Only the compound index `{ slug: 1, parent: 1 }` is now defined explicitly

**File Modified**: `backend/models/Category.js`

### 3. 502 Bad Gateway Error ⚠️
**Error**: `GET https://www.jjtextiles.com/ 502 (Bad Gateway)`

**Possible Causes**:
1. Backend server not running
2. Nginx configuration issue
3. Backend crashed due to MODULE_NOT_FOUND error

**Solution Steps**:
1. Check PM2 status: `pm2 status`
2. Check backend logs: `pm2 logs jjtextiles-backend --lines 50`
3. If backend is down, restart: `pm2 restart jjtextiles-backend`
4. Check Nginx error logs: `tail -f /var/log/nginx/error.log`
5. Verify backend is listening on correct port

### 4. 404 Favicon Error ℹ️
**Error**: `GET https://www.jjtextiles.com/favicon.ico 404 (Not Found)`

**Status**: Non-critical, but can be fixed by adding favicon to public folder.

## Deployment Steps

### Step 1: Fix Category Model (Already Done)
The Category model has been updated to prevent duplicate index warnings.

### Step 2: Install Missing Dependencies (Production Server)
```bash
cd /var/www/jjtextiles-ecom/backend
npm install express-pino-logger
npm install  # Ensure all dependencies are installed
```

### Step 3: Restart Services
```bash
# Restart backend
pm2 restart jjtextiles-backend

# Check status
pm2 status
pm2 logs jjtextiles-backend --lines 20
```

### Step 4: Verify Backend is Running
```bash
# Check if backend is responding
curl http://localhost:4000/api/health

# Or check from frontend
curl https://www.jjtextiles.com/api/health
```

### Step 5: Check Nginx Configuration
```bash
# Test Nginx config
sudo nginx -t

# Reload Nginx if config is valid
sudo systemctl reload nginx
```

## Verification Checklist

- [ ] `express-pino-logger` installed in production
- [ ] Backend PM2 process running
- [ ] No duplicate index warnings in logs
- [ ] Backend health endpoint responding
- [ ] Frontend can connect to backend API
- [ ] No 502 errors in browser console

## Additional Notes

- The duplicate index warning was harmless but cluttered logs
- The MODULE_NOT_FOUND error would prevent backend from starting
- 502 errors indicate backend is not accessible, likely due to crash or not running
- All fixes are backward compatible and won't affect existing data

