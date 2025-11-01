#!/bin/bash

# ========================================
# MONGODB SETUP SCRIPT FOR JJTEXTILES
# Creates new database and user for JJTextiles project
# ========================================

set -e

echo "🗄️  Setting up MongoDB for JJTextiles..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
DB_NAME="jjtextiles_maternity_db"
DB_USER="jjtextiles"
ADMIN_USER="shithaa"
ADMIN_PASS="shithaamongopassword255506511ypyq2jvcl"

echo -e "${BLUE}Step 1: Generating secure password...${NC}"
DB_PASSWORD=$(openssl rand -base64 24)
echo -e "${GREEN}Generated password: ${DB_PASSWORD}${NC}"
echo -e "${YELLOW}⚠️  SAVE THIS PASSWORD! You'll need it for backend/.env${NC}"
echo ""

# Prompt for password confirmation
read -p "Do you want to use this generated password? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    read -sp "Enter your custom password: " DB_PASSWORD
    echo ""
fi

echo -e "${BLUE}Step 2: Connecting to MongoDB...${NC}"

# Create MongoDB script
MONGO_SCRIPT=$(cat <<EOF
// Switch to admin database for authentication
use admin
db.auth("${ADMIN_USER}", "${ADMIN_PASS}")

// Switch to new database (creates it if doesn't exist)
use ${DB_NAME}

// Check if user already exists
var existingUser = db.getUser("${DB_USER}")
if (existingUser) {
    print("⚠️  User ${DB_USER} already exists. Dropping...")
    db.dropUser("${DB_USER}")
}

// Create new user
print("📝 Creating user ${DB_USER}...")
db.createUser({
  user: "${DB_USER}",
  pwd: "${DB_PASSWORD}",
  roles: [
    { role: "readWrite", db: "${DB_NAME}" }
  ]
})

// Verify user creation
print("✅ Verifying user creation...")
var users = db.getUsers()
print("Users in ${DB_NAME}:")
users.forEach(function(user) {
    print("  - " + user.user)
})

print("")
print("✅ Database and user created successfully!")
print("")
print("📋 Connection String:")
print("mongodb://${DB_USER}:${DB_PASSWORD}@localhost:27017/${DB_NAME}?authSource=admin")
print("")
EOF
)

# Execute MongoDB script
echo "$MONGO_SCRIPT" | mongosh

echo ""
echo -e "${GREEN}✅ MongoDB setup complete!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Add this to backend/.env:"
echo "   MONGODB_URI=mongodb://${DB_USER}:${DB_PASSWORD}@localhost:27017/${DB_NAME}?authSource=admin"
echo ""
echo "2. Test the connection:"
echo "   mongosh \"mongodb://${DB_USER}:${DB_PASSWORD}@localhost:27017/${DB_NAME}?authSource=admin\""
echo ""
echo -e "${RED}⚠️  IMPORTANT: Save this password securely!${NC}"
echo "Password: ${DB_PASSWORD}"

