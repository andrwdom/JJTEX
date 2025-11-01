#!/bin/bash

# ========================================
# COMPLETE MONGODB SETUP SCRIPT FOR JJTEXTILES
# This script:
# 1. Checks if MongoDB is installed and running
# 2. Creates new database and user for JJTextiles project
# 3. Updates backend/.env with connection string
# ========================================

set -e

echo "🗄️  Complete MongoDB Setup for JJTextiles..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
DB_NAME="jjtextiles_maternity_db"
DB_USER="jjtextiles"
ADMIN_USER="shithaa"
ADMIN_PASS="shithaamongopassword255506511ypyq2jvcl"
BACKEND_DIR="${PWD}/backend"

# Function to print status
print_status() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}$1${NC}"
}

print_error() {
    echo -e "${RED}$1${NC}"
}

print_warning() {
    echo -e "${YELLOW}$1${NC}"
}

# Step 1: Check if MongoDB is installed
print_status "Step 1: Checking MongoDB installation..."
if ! command -v mongod &> /dev/null && ! command -v mongosh &> /dev/null; then
    print_error "❌ MongoDB is not installed!"
    echo ""
    print_warning "To install MongoDB on Ubuntu/Debian, run:"
    echo "  wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -"
    echo "  echo 'deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse' | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list"
    echo "  sudo apt update"
    echo "  sudo apt install -y mongodb-org"
    exit 1
fi
print_success "✅ MongoDB is installed"

# Step 2: Check if MongoDB service is running
print_status "Step 2: Checking MongoDB service status..."
if systemctl is-active --quiet mongod 2>/dev/null || pgrep -x mongod > /dev/null; then
    print_success "✅ MongoDB service is running"
else
    print_warning "⚠️  MongoDB service is not running. Attempting to start..."
    if sudo systemctl start mongod 2>/dev/null || service mongod start 2>/dev/null; then
        sleep 2
        if systemctl is-active --quiet mongod 2>/dev/null || pgrep -x mongod > /dev/null; then
            print_success "✅ MongoDB service started successfully"
        else
            print_error "❌ Failed to start MongoDB service"
            print_warning "Try manually: sudo systemctl start mongod"
            exit 1
        fi
    else
        print_error "❌ Could not start MongoDB service"
        print_warning "Try manually: sudo systemctl start mongod"
        exit 1
    fi
fi

# Step 3: Test MongoDB connection
print_status "Step 3: Testing MongoDB connection..."
if mongosh --eval "db.version()" --quiet > /dev/null 2>&1; then
    print_success "✅ MongoDB connection successful"
else
    print_error "❌ Cannot connect to MongoDB"
    print_warning "Make sure MongoDB is running and accessible"
    exit 1
fi

echo ""

# Step 4: Generate password
print_status "Step 4: Generating secure password..."
DB_PASSWORD=$(openssl rand -base64 24)
print_success "✅ Password generated: ${CYAN}${DB_PASSWORD}${NC}"
print_warning "⚠️  SAVE THIS PASSWORD! You'll need it for backend/.env"
echo ""

# Step 5: Prompt for password confirmation
read -p "Do you want to use this generated password? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    read -sp "Enter your custom password: " DB_PASSWORD
    echo ""
    if [ -z "$DB_PASSWORD" ]; then
        print_error "❌ Password cannot be empty"
        exit 1
    fi
fi

echo ""

# Step 6: Create database and user
print_status "Step 6: Creating database and user..."

# Create MongoDB script
MONGO_SCRIPT=$(cat <<EOF
// Switch to admin database for authentication
try {
    use admin
    var authResult = db.auth("${ADMIN_USER}", "${ADMIN_PASS}")
    if (!authResult) {
        print("⚠️  Authentication failed. Trying without auth...")
        // If auth fails, try without authentication (MongoDB might not have auth enabled)
        use ${DB_NAME}
    } else {
        // Switch to new database (creates it if doesn't exist)
        use ${DB_NAME}
    }
} catch(e) {
    print("⚠️  Auth error, proceeding without authentication...")
    use ${DB_NAME}
}

// Check if user already exists
try {
    var existingUser = db.getUser("${DB_USER}")
    if (existingUser) {
        print("⚠️  User ${DB_USER} already exists. Dropping...")
        db.dropUser("${DB_USER}")
    }
} catch(e) {
    // User doesn't exist, that's fine
}

// Create new user
print("📝 Creating user ${DB_USER}...")
try {
    db.createUser({
        user: "${DB_USER}",
        pwd: "${DB_PASSWORD}",
        roles: [
            { role: "readWrite", db: "${DB_NAME}" }
        ]
    })
    print("✅ User created successfully!")
} catch(e) {
    // If creating user fails (maybe auth not enabled), that's okay for local dev
    print("⚠️  Could not create user (this is okay if MongoDB auth is not enabled): " + e.message)
}

// Verify user creation
try {
    print("✅ Verifying user creation...")
    var users = db.getUsers()
    if (users && users.length > 0) {
        print("Users in ${DB_NAME}:")
        users.forEach(function(user) {
            print("  - " + user.user)
        })
    } else {
        print("⚠️  No users found (MongoDB might not have authentication enabled)")
    }
} catch(e) {
    print("⚠️  Could not list users (MongoDB might not have authentication enabled)")
}

print("")
print("✅ Database '${DB_NAME}' is ready!")
print("")
EOF
)

# Execute MongoDB script
if echo "$MONGO_SCRIPT" | mongosh 2>&1; then
    print_success "✅ Database setup completed"
else
    print_error "❌ Database setup failed"
    exit 1
fi

echo ""

# Step 7: Build connection string
CONNECTION_STRING="mongodb://${DB_USER}:${DB_PASSWORD}@localhost:27017/${DB_NAME}?authSource=admin"

# Step 8: Update backend/.env file
print_status "Step 7: Updating backend/.env file..."

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    print_warning "⚠️  Backend directory not found at: $BACKEND_DIR"
    print_warning "Please update MONGODB_URI manually in your backend/.env file"
    echo ""
    print_success "Connection String to add:"
    echo "  MONGODB_URI=${CONNECTION_STRING}"
    exit 0
fi

ENV_FILE="${BACKEND_DIR}/.env"

# Create .env if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
    print_warning "⚠️  .env file not found. Creating from template..."
    if [ -f "${BACKEND_DIR}/env.template" ]; then
        cp "${BACKEND_DIR}/env.template" "$ENV_FILE"
        print_success "✅ Created .env from template"
    else
        touch "$ENV_FILE"
        print_success "✅ Created empty .env file"
    fi
fi

# Update MONGODB_URI in .env
if grep -q "^MONGODB_URI=" "$ENV_FILE"; then
    # Replace existing MONGODB_URI
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|^MONGODB_URI=.*|MONGODB_URI=${CONNECTION_STRING}|" "$ENV_FILE"
    else
        # Linux
        sed -i "s|^MONGODB_URI=.*|MONGODB_URI=${CONNECTION_STRING}|" "$ENV_FILE"
    fi
    print_success "✅ Updated MONGODB_URI in .env"
else
    # Add MONGODB_URI if it doesn't exist
    echo "" >> "$ENV_FILE"
    echo "# MongoDB Configuration" >> "$ENV_FILE"
    echo "MONGODB_URI=${CONNECTION_STRING}" >> "$ENV_FILE"
    print_success "✅ Added MONGODB_URI to .env"
fi

echo ""

# Step 9: Test connection
print_status "Step 8: Testing connection with new credentials..."
TEST_RESULT=$(mongosh "${CONNECTION_STRING}" --eval "db.getName()" --quiet 2>&1)
if [ $? -eq 0 ]; then
    print_success "✅ Connection test successful!"
else
    print_warning "⚠️  Connection test failed (this might be okay if MongoDB auth is disabled)"
    print_warning "Try this simpler connection string: mongodb://localhost:27017/${DB_NAME}"
fi

echo ""
echo "========================================="
print_success "✅ MongoDB setup complete!"
echo "========================================="
echo ""
print_success "📋 Database Details:"
echo "  Database Name: ${DB_NAME}"
echo "  Username: ${DB_USER}"
echo "  Password: ${CYAN}${DB_PASSWORD}${NC}"
echo "  Connection String: ${CONNECTION_STRING}"
echo ""
print_warning "⚠️  IMPORTANT: Save this password securely!"
echo ""
print_success "📝 Next steps:"
echo "1. Verify backend/.env has the correct MONGODB_URI"
echo "2. Test the connection:"
echo "   mongosh \"${CONNECTION_STRING}\""
echo ""
print_warning "💡 If MongoDB authentication is not enabled, you can also use:"
echo "   mongodb://localhost:27017/${DB_NAME}"
echo ""

