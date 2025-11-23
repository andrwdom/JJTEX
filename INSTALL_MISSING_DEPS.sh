#!/bin/bash

#######################################################################
# INSTALL ALL MISSING DEPENDENCIES FOR PRODUCTION
# 
# This script installs all missing dependencies that are causing
# the backend to crash.
#######################################################################

set -e

echo "=================================================="
echo "📦 Installing Missing Dependencies"
echo "=================================================="
echo ""

cd /var/www/jjtextiles-ecom/backend

echo "Installing all missing packages..."
npm install express-pino-logger@^7.0.0 winston@^3.11.0 @sentry/node pdfkit@^0.15.0

echo ""
echo "Installing all dependencies to ensure everything is up to date..."
npm install

echo ""
echo "=================================================="
echo "✅ Dependencies Installed!"
echo "=================================================="
echo ""
echo "Now restart the backend:"
echo "  pm2 restart jjtextiles-backend"
echo ""
echo "Check status:"
echo "  pm2 logs jjtextiles-backend --lines 30"
echo ""

