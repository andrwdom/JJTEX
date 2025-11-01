#!/bin/bash

# ========================================
# QUICK VPS FOLDER SETUP SCRIPT
# Creates /var/www/jjtextiles-ecom and clones repo
# ========================================

set -e

echo "🚀 Setting up JJTextiles folder on VPS..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Repository URL
REPO_URL="https://github.com/andrwdom/JJTEX.git"
PROJECT_DIR="/var/www/jjtextiles-ecom"

echo -e "${BLUE}Step 1: Creating directory...${NC}"
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

echo -e "${BLUE}Step 2: Cloning repository...${NC}"
if [ -d ".git" ]; then
    echo -e "${YELLOW}Git already initialized. Pulling latest changes...${NC}"
    git pull origin develop
else
    git clone "$REPO_URL" .
fi

echo -e "${BLUE}Step 3: Creating required directories...${NC}"
mkdir -p backend/logs
mkdir -p frontend/logs
mkdir -p admin/logs
mkdir -p uploads/products
mkdir -p uploads/temp

echo -e "${BLUE}Step 4: Setting permissions...${NC}"
chown -R $USER:$USER "$PROJECT_DIR"
chmod -R 755 "$PROJECT_DIR"

echo -e "${GREEN}✅ Directory setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Set up environment variables:"
echo "   cd $PROJECT_DIR/backend && nano .env"
echo "   cd $PROJECT_DIR/frontend && nano .env.production"
echo "   cd $PROJECT_DIR/admin && nano .env"
echo ""
echo "2. Install dependencies:"
echo "   cd $PROJECT_DIR/backend && npm install"
echo "   cd $PROJECT_DIR/frontend && npm install"
echo "   cd $PROJECT_DIR/admin && npm install"
echo ""
echo "3. Build projects:"
echo "   cd $PROJECT_DIR/frontend && npm run build"
echo "   cd $PROJECT_DIR/admin && npm run build"
echo ""
echo "4. Start with PM2:"
echo "   cd $PROJECT_DIR && pm2 start ecosystem.config.js"
echo ""
echo -e "${GREEN}Done! 🎉${NC}"

