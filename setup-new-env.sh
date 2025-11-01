#!/bin/bash

# ========================================
# ENVIRONMENT SETUP SCRIPT FOR JJTEXTILES
# This script helps set up environment files from templates
# ========================================

set -e

echo "🔧 Setting up JJTextiles environment configuration..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="/var/www/jjtextiles-ecom"

# Check if we're in the right directory or if directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}Error: $PROJECT_DIR does not exist!${NC}"
    echo "Please create the directory first or update PROJECT_DIR in this script."
    exit 1
fi

cd "$PROJECT_DIR"

echo -e "${BLUE}Step 1: Setting up Backend environment...${NC}"
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/env.template" ]; then
        cp backend/env.template backend/.env
        echo -e "${GREEN}✅ Created backend/.env from template${NC}"
        echo -e "${YELLOW}⚠️  Please edit backend/.env and fill in all required values!${NC}"
    else
        echo -e "${RED}Template not found. Creating empty .env file${NC}"
        touch backend/.env
    fi
else
    echo -e "${YELLOW}backend/.env already exists, skipping...${NC}"
fi

echo -e "${BLUE}Step 2: Setting up Frontend environment...${NC}"
if [ ! -f "frontend/.env.production" ]; then
    if [ -f "frontend/env.production.template" ]; then
        cp frontend/env.production.template frontend/.env.production
        echo -e "${GREEN}✅ Created frontend/.env.production from template${NC}"
        echo -e "${YELLOW}⚠️  Please edit frontend/.env.production and fill in all required values!${NC}"
    else
        echo -e "${RED}Template not found. Creating empty .env.production file${NC}"
        touch frontend/.env.production
    fi
else
    echo -e "${YELLOW}frontend/.env.production already exists, skipping...${NC}"
fi

echo -e "${BLUE}Step 3: Setting up Admin environment...${NC}"
if [ ! -f "admin/.env" ]; then
    if [ -f "admin/env.template" ]; then
        cp admin/env.template admin/.env
        echo -e "${GREEN}✅ Created admin/.env from template${NC}"
        echo -e "${YELLOW}⚠️  Please edit admin/.env and fill in all required values!${NC}"
    else
        echo -e "${RED}Template not found. Creating empty .env file${NC}"
        touch admin/.env
    fi
else
    echo -e "${YELLOW}admin/.env already exists, skipping...${NC}"
fi

echo -e "${BLUE}Step 4: Setting file permissions...${NC}"
chmod 600 backend/.env 2>/dev/null || true
chmod 600 frontend/.env.production 2>/dev/null || true
chmod 600 admin/.env 2>/dev/null || true

echo -e "${BLUE}Step 5: Creating required directories...${NC}"
mkdir -p backend/logs
mkdir -p frontend/logs
mkdir -p admin/logs
mkdir -p uploads/products
mkdir -p uploads/temp

echo ""
echo -e "${GREEN}✅ Environment setup complete!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Edit backend/.env and fill in:"
echo "   - MongoDB connection string"
echo "   - JWT Secret (generate with: openssl rand -base64 32)"
echo "   - Admin credentials"
echo "   - PhonePe credentials"
echo "   - Firebase Admin SDK path"
echo "   - Email configuration"
echo ""
echo "2. Edit frontend/.env.production and fill in:"
echo "   - Firebase configuration"
echo "   - API URL"
echo ""
echo "3. Edit admin/.env and fill in:"
echo "   - API URL"
echo ""
echo "4. Generate secrets:"
echo "   JWT Secret: openssl rand -base64 32"
echo "   Webhook Password: openssl rand -base64 24"
echo ""
echo -e "${GREEN}Done! 🎉${NC}"

