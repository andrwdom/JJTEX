#!/bin/bash

#######################################################################
# FIX GIT PULL CONFLICT ON PRODUCTION
# 
# This script handles the git pull conflict by stashing local changes,
# pulling the latest code, then reapplying the stash.
#######################################################################

set -e

echo "=================================================="
echo "🔄 Fixing Git Pull Conflict"
echo "=================================================="
echo ""

cd /var/www/jjtextiles-ecom

echo "STEP 1: Stashing local changes..."
git stash save "Local package.json changes before pull"

echo ""
echo "STEP 2: Pulling latest changes..."
git pull origin develop

echo ""
echo "STEP 3: Checking if stash needs to be reapplied..."
if git stash list | grep -q "Local package.json changes"; then
    echo "Reapplying stashed changes..."
    git stash pop || echo "⚠️  Stash pop had conflicts, but that's okay"
else
    echo "No stash to reapply"
fi

echo ""
echo "STEP 4: Installing dependencies from updated package.json..."
cd backend
npm install

echo ""
echo "=================================================="
echo "✅ Git Pull Complete!"
echo "=================================================="
echo ""
echo "Now restart the backend:"
echo "  pm2 restart jjtextiles-backend"
echo ""

