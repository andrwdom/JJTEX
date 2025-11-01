# 🗄️ MongoDB Setup Guide - Create New Database for JJTextiles

This guide will help you create a new MongoDB database for the JJTextiles project on your VPS.

## 📋 Prerequisites

- MongoDB should already be installed and running (since you have shithaa-ecom database)
- Access to the VPS via SSH as root or user with sudo privileges

---

## Step 1: Connect to MongoDB

```bash
# Connect to MongoDB (as admin user or root)
mongosh

# Or if authentication is required:
mongosh -u admin -p your_admin_password

# Or connect directly to admin database:
mongosh "mongodb://shithaa:shithaamongopassword255506511ypyq2jvcl@localhost:27017/admin"
```

---

## Step 2: Create New Database

Once connected to MongoDB, run:

```javascript
// Switch to new database (creates it if doesn't exist)
use jjtextiles_maternity_db

// Verify you're on the right database
db.getName()
```

---

## Step 3: Create Database User

**Option A: Create User with Read/Write Permissions (Recommended)**

```javascript
// Make sure you're in the correct database
use jjtextiles_maternity_db

// Create user with read and write permissions
db.createUser({
  user: "jjtextiles",
  pwd: "jjtextiles_mongo_password_2024_secure",  // CHANGE THIS to a secure password!
  roles: [
    { role: "readWrite", db: "jjtextiles_maternity_db" }
  ]
})
```

**Option B: Use Admin User (Less Secure - Not Recommended)**

If you want to reuse the admin user, you can skip creating a new user and use the admin credentials in your connection string.

---

## Step 4: Verify User Creation

```javascript
// Check if user was created
db.getUsers()

// You should see the new user listed
```

---

## Step 5: Test Connection

Exit MongoDB shell:
```javascript
exit
```

Test the connection string:

```bash
# Test connection with new user
mongosh "mongodb://jjtextiles:jjtextiles_mongo_password_2024_secure@localhost:27017/jjtextiles_maternity_db?authSource=jjtextiles_maternity_db"
```

**Or test with authSource as admin:**

```bash
mongosh "mongodb://jjtextiles:jjtextiles_mongo_password_2024_secure@localhost:27017/jjtextiles_maternity_db?authSource=admin"
```

---

## Step 6: Update Backend .env File

Once the database and user are created, update your `backend/.env` file:

```bash
cd /var/www/jjtextiles-ecom/backend
nano .env
```

Update the `MONGODB_URI` line:

```env
MONGODB_URI=mongodb://jjtextiles:jjtextiles_mongo_password_2024_secure@localhost:27017/jjtextiles_maternity_db?authSource=admin
```

**Important Notes:**
- Replace `jjtextiles_mongo_password_2024_secure` with the actual password you created
- `authSource=admin` means authentication happens against the admin database
- If you created the user in `jjtextiles_maternity_db`, use `authSource=jjtextiles_maternity_db`

---

## Complete Setup Script

Here's a complete script you can copy-paste:

```bash
# Connect to MongoDB
mongosh "mongodb://shithaa:shithaamongopassword255506511ypyq2jvcl@localhost:27017/admin"
```

Then in MongoDB shell:

```javascript
// Switch to new database
use jjtextiles_maternity_db

// Create user (CHANGE THE PASSWORD!)
db.createUser({
  user: "jjtextiles",
  pwd: "jjtextiles_mongo_password_2024_secure",
  roles: [
    { role: "readWrite", db: "jjtextiles_maternity_db" }
  ]
})

// Verify
db.getUsers()

// Exit
exit
```

---

## Alternative: Using Admin Database for Authentication

If you prefer to authenticate users through the admin database (common setup):

```javascript
// Connect to admin database
use admin

// Create user that can access jjtextiles database
db.createUser({
  user: "jjtextiles",
  pwd: "jjtextiles_mongo_password_2024_secure",
  roles: [
    { role: "readWrite", db: "jjtextiles_maternity_db" }
  ]
})
```

Then your connection string would be:
```
mongodb://jjtextiles:jjtextiles_mongo_password_2024_secure@localhost:27017/jjtextiles_maternity_db?authSource=admin
```

---

## Generate Secure Password

If you want to generate a secure password:

```bash
# Generate random password
openssl rand -base64 24

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"
```

---

## Verify Database Exists

After creation, verify the database exists:

```javascript
// List all databases
show dbs

// You should see jjtextiles_maternity_db listed
```

---

## Troubleshooting

### Issue: "Command createUser requires authentication"

**Solution:**
```javascript
// Connect as admin first
use admin
db.auth("shithaa", "shithaamongopassword255506511ypyq2jvcl")
// Then create user
use jjtextiles_maternity_db
db.createUser({...})
```

### Issue: "User already exists"

**Solution:**
```javascript
// Drop existing user
use jjtextiles_maternity_db
db.dropUser("jjtextiles")
// Then create again
db.createUser({...})
```

### Issue: "Cannot connect to MongoDB"

**Solution:**
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB if not running
sudo systemctl start mongod

# Enable auto-start
sudo systemctl enable mongod
```

### Issue: "Authentication failed"

**Solution:**
- Double-check the password (copy-paste carefully)
- Verify `authSource` parameter matches where user was created
- Try authenticating with admin user first

---

## Security Best Practices

1. **Use Strong Passwords**: Generate secure passwords with `openssl rand -base64 24`
2. **Limit Permissions**: Only grant `readWrite` to the specific database needed
3. **Don't Use Admin User**: Create dedicated users for each application
4. **Use authSource Properly**: Specify the correct authentication database
5. **Store Passwords Securely**: Keep `.env` files with 600 permissions

---

## Quick Reference

**Connection String Format:**
```
mongodb://[username]:[password]@[host]:[port]/[database]?authSource=[auth_database]
```

**Example:**
```
mongodb://jjtextiles:secure_password@localhost:27017/jjtextiles_maternity_db?authSource=admin
```

**Common Commands:**
```javascript
// Show databases
show dbs

// Switch database
use database_name

// Show current database
db.getName()

// List users
db.getUsers()

// Create user
db.createUser({ user: "...", pwd: "...", roles: [...] })

// Drop user
db.dropUser("username")

// Exit
exit
```

---

## Next Steps

After creating the database:

1. ✅ Update `backend/.env` with the connection string
2. ✅ Test connection from Node.js app
3. ✅ Initialize database with required collections (if needed)
4. ✅ Set up database indexes (optional, but recommended)

For testing the connection from your Node.js app:

```bash
cd /var/www/jjtextiles-ecom/backend
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('✅ Connected!')).catch(e => console.error('❌ Error:', e.message))"
```

