#!/bin/bash

#######################################################################
# PRODUCTION ERROR FIXES DEPLOYMENT SCRIPT
# 
# Fixes:
# 1. Missing express-pino-logger dependency
# 2. Duplicate index warnings in Category model
#######################################################################

set -e  # Exit on error

echo "=================================================="
echo "🔧 Deploying Production Error Fixes"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠️  Not running as root. Some commands may need sudo.${NC}"
fi

echo -e "${BLUE}STEP 1: Installing missing dependencies${NC}"
echo "----------------------------------------"
cd /var/www/jjtextiles-ecom/backend

# Install express-pino-logger
echo "Installing express-pino-logger..."
npm install express-pino-logger@^7.0.0 --save

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ express-pino-logger installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install express-pino-logger${NC}"
    exit 1
fi

# Ensure all dependencies are installed
echo "Installing all dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ All dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}STEP 2: Verifying Category model fix${NC}"
echo "----------------------------------------"
# Check if Category.js has the fix
if grep -q "index: false" /var/www/jjtextiles-ecom/backend/models/Category.js; then
    echo -e "${GREEN}✅ Category model fix verified${NC}"
else
    echo -e "${YELLOW}⚠️  Category model fix not found. Please ensure the fix is deployed.${NC}"
fi

echo ""
echo -e "${BLUE}STEP 3: Restarting backend service${NC}"
echo "----------------------------------------"
# Restart PM2 backend
pm2 restart jjtextiles-backend

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend restarted successfully${NC}"
else
    echo -e "${RED}❌ Failed to restart backend${NC}"
    echo "Trying to start if not running..."
    pm2 start jjtextiles-backend || pm2 start ecosystem.config.js
fi

echo ""
echo -e "${BLUE}STEP 4: Checking service status${NC}"
echo "----------------------------------------"
pm2 status

echo ""
echo -e "${BLUE}STEP 5: Checking backend logs${NC}"
echo "----------------------------------------"
echo "Last 20 lines of backend logs:"
pm2 logs jjtextiles-backend --lines 20 --nostream

echo ""
echo -e "${BLUE}STEP 6: Testing backend health${NC}"
echo "----------------------------------------"
sleep 3  # Wait for backend to start
if curl -f http://localhost:4000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is responding${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check failed. Check logs for errors.${NC}"
fi

echo ""
echo -e "${GREEN}=================================================="
echo "✅ Deployment Complete!"
echo "==================================================${NC}"
echo ""
echo "Next steps:"
echo "1. Monitor logs: pm2 logs jjtextiles-backend"
echo "2. Check for errors: pm2 logs jjtextiles-backend --err"
echo "3. Verify no duplicate index warnings appear"
echo "4. Test frontend connection to backend"
echo ""

