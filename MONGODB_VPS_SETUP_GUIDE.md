# 🗄️ MongoDB Setup Guide for VPS

This guide will help you set up a local MongoDB database specifically for your JJTextiles codebase on your VPS.

## 📋 Quick Start

### Option 1: Automated Setup (Recommended)

1. **Make the script executable:**
   ```bash
   chmod +x setup-mongodb-complete.sh
   ```

2. **Run the setup script:**
   ```bash
   ./setup-mongodb-complete.sh
   ```

   The script will:
   - ✅ Check if MongoDB is installed
   - ✅ Verify MongoDB service is running
   - ✅ Create a new database: `jjtextiles_maternity_db`
   - ✅ Create a new user: `jjtextiles`
   - ✅ Generate a secure password
   - ✅ Automatically update `backend/.env` with the connection string

### Option 2: Manual Setup

If you prefer to set it up manually or the script doesn't work:

#### Step 1: Check MongoDB Status

```bash
# Check if MongoDB is installed
mongosh --version

# Check if MongoDB service is running
sudo systemctl status mongod

# If not running, start it:
sudo systemctl start mongod
sudo systemctl enable mongod  # Enable auto-start on boot
```

#### Step 2: Create Database and User

Run the original setup script:

```bash
chmod +x setup-mongodb.sh
./setup-mongodb.sh
```

**Or manually create using mongosh:**

```bash
mongosh
```

Then in the MongoDB shell:

```javascript
// Authenticate as admin (if needed)
use admin
db.auth("shithaa", "shithaamongopassword255506511ypyq2jvcl")

// Create new database and user
use jjtextiles_maternity_db

db.createUser({
  user: "jjtextiles",
  pwd: "YOUR_SECURE_PASSWORD_HERE",  // Generate with: openssl rand -base64 24
  roles: [
    { role: "readWrite", db: "jjtextiles_maternity_db" }
  ]
})
```

#### Step 3: Update backend/.env

Edit `backend/.env` and add/update the MongoDB connection string:

```bash
cd backend
nano .env
```

Add or update this line:

```env
MONGODB_URI=mongodb://jjtextiles:YOUR_PASSWORD@localhost:27017/jjtextiles_maternity_db?authSource=admin
```

**Important:** Replace `YOUR_PASSWORD` with the actual password you created!

#### Step 4: Test the Connection

```bash
# Test connection
mongosh "mongodb://jjtextiles:YOUR_PASSWORD@localhost:27017/jjtextiles_maternity_db?authSource=admin"

# Or if MongoDB authentication is not enabled:
mongosh "mongodb://localhost:27017/jjtextiles_maternity_db"
```

## 🔧 Troubleshooting

### MongoDB Not Installed

If MongoDB is not installed on your VPS:

```bash
# For Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### MongoDB Service Not Running

```bash
# Start MongoDB
sudo systemctl start mongod

# Check status
sudo systemctl status mongod

# View logs if there are issues
sudo journalctl -u mongod -n 50
```

### Authentication Errors

If you get authentication errors, MongoDB might not have authentication enabled. In that case:

1. **Option A:** Enable authentication in MongoDB (more secure):
   - Edit `/etc/mongod.conf`
   - Uncomment `security:` section
   - Add `authorization: enabled`
   - Restart MongoDB: `sudo systemctl restart mongod`

2. **Option B:** Use simpler connection string (less secure, okay for local):
   ```env
   MONGODB_URI=mongodb://localhost:27017/jjtextiles_maternity_db
   ```

### Connection String Issues

**If authentication is enabled:**
```env
MONGODB_URI=mongodb://jjtextiles:YOUR_PASSWORD@localhost:27017/jjtextiles_maternity_db?authSource=admin
```

**If authentication is NOT enabled:**
```env
MONGODB_URI=mongodb://localhost:27017/jjtextiles_maternity_db
```

### Cannot Find backend/.env

If the script can't find your backend directory:

1. Make sure you're in the project root directory
2. Verify the backend directory exists: `ls -la backend/`
3. If using a different path, manually update `.env` after running the database setup

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] MongoDB service is running: `sudo systemctl status mongod`
- [ ] Can connect to MongoDB: `mongosh`
- [ ] Database exists: `use jjtextiles_maternity_db` then `db.getName()`
- [ ] User exists: `db.getUsers()` (in MongoDB shell)
- [ ] `.env` file has correct `MONGODB_URI`
- [ ] Backend can connect (check backend logs when starting)

## 📝 Database Details

- **Database Name:** `jjtextiles_maternity_db`
- **Username:** `jjtextiles`
- **Password:** (Generated during setup - save it securely!)
- **Host:** `localhost`
- **Port:** `27017`

## 🔐 Security Notes

1. **Save your database password securely** - you'll need it for `backend/.env`
2. **Enable MongoDB authentication** for production environments
3. **Restrict MongoDB network access** if exposed to the internet
4. **Regular backups** - MongoDB data is stored in `/var/lib/mongodb/` by default

## 🆘 Need Help?

If you encounter issues:

1. Check MongoDB logs: `sudo journalctl -u mongod -n 100`
2. Test MongoDB connection: `mongosh --eval "db.version()"`
3. Verify .env file format (no extra spaces, correct quotes)
4. Check backend logs for connection errors

