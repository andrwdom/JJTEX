# ⚡ Quick Environment Setup - Commands to Run on VPS

Follow these commands step-by-step on your VPS to set up the new JJTextiles environment.

## 📍 Prerequisites

You should already have:
- `/var/www/jjtextiles-ecom` folder created
- Repository cloned into that folder

---

## Step 1: Navigate to Project

```bash
cd /var/www/jjtextiles-ecom
```

---

## Step 2: Copy Environment Templates

### Backend
```bash
cd backend
cp env.template .env
nano .env
# Edit and save with your values (see template file)
```

### Frontend
```bash
cd ../frontend
cp env.production.template .env.production
nano .env.production
# Edit and save with your values
```

### Admin
```bash
cd ../admin
cp env.template .env
nano .env
# Edit and save with your values
```

---

## Step 3: Generate Secure Secrets

```bash
# Generate JWT Secret (copy this to backend/.env)
openssl rand -base64 32

# Generate Webhook Password (copy this to backend/.env)
openssl rand -base64 24
```

---

## Step 4: Set Up Firebase Admin SDK

**Option A: Reuse Existing Firebase Project**
```bash
# Copy Firebase Admin SDK file
cp /var/www/shithaa-ecom/backend/shithaa-ecom-firebase-adminsdk-*.json \
   /var/www/jjtextiles-ecom/backend/

# Update the filename in backend/.env to match the copied file
```

**Option B: Create New Firebase Project**
1. Go to Firebase Console
2. Create new project: `jjtextiles-ecom`
3. Download Admin SDK JSON
4. Upload to: `/var/www/jjtextiles-ecom/backend/`
5. Update `GOOGLE_APPLICATION_CREDENTIALS` path in `backend/.env`

---

## Step 5: Set Up MongoDB

**Option A: Create New Database (Recommended)**
```bash
mongosh
```

Then in MongoDB shell:
```javascript
use jjtextiles_maternity_db
db.createUser({
  user: "jjtextiles",
  pwd: "your_secure_password",
  roles: [{ role: "readWrite", db: "jjtextiles_maternity_db" }]
})
```

Then update `MONGODB_URI` in `backend/.env`:
```
MONGODB_URI=mongodb://jjtextiles:your_secure_password@localhost:27017/jjtextiles_maternity_db?authSource=admin
```

**Option B: Use Same Database**
Just update `MONGODB_URI` in `backend/.env` to point to existing database.

---

## Step 6: Create Required Directories

```bash
cd /var/www/jjtextiles-ecom

# Create directories
mkdir -p backend/logs frontend/logs admin/logs
mkdir -p uploads/products uploads/temp

# Set permissions
chown -R $USER:$USER /var/www/jjtextiles-ecom
chmod -R 755 /var/www/jjtextiles-ecom
chmod 600 backend/.env frontend/.env.production admin/.env
```

---

## Step 7: Install Dependencies

```bash
# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install admin dependencies
cd admin && npm install && cd ..
```

---

## Step 8: Build Projects

```bash
# Build frontend
cd frontend && npm run build && cd ..

# Build admin
cd admin && npm run build && cd ..
```

---

## Step 9: Test Configuration

```bash
# Test backend environment variables are loaded
cd backend
node -e "require('dotenv').config(); console.log('MongoDB:', process.env.MONGODB_URI ? 'Set ✓' : 'Missing ✗'); console.log('JWT:', process.env.JWT_SECRET ? 'Set ✓' : 'Missing ✗');"
cd ..
```

---

## Step 10: Start Services with PM2

```bash
cd /var/www/jjtextiles-ecom

# Start all services
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs

# Save PM2 configuration
pm2 save
```

---

## 📝 Quick Copy-Paste Setup (All at Once)

```bash
# Navigate
cd /var/www/jjtextiles-ecom

# Copy templates
cp backend/env.template backend/.env
cp frontend/env.production.template frontend/.env.production
cp admin/env.template admin/.env

# Generate secrets
echo "JWT Secret:"
openssl rand -base64 32
echo ""
echo "Webhook Password:"
openssl rand -base64 24

# Create directories
mkdir -p backend/logs frontend/logs admin/logs uploads/products uploads/temp

# Set permissions
chmod 600 backend/.env frontend/.env.production admin/.env

# Now edit the .env files with nano/vi
echo "✅ Templates copied! Now edit:"
echo "   - backend/.env"
echo "   - frontend/.env.production"
echo "   - admin/.env"
```

---

## ⚠️ Important Decisions to Make

### 1. **Firebase Project**
- [ ] Create new Firebase project for JJTextiles
- [ ] Reuse existing Firebase project

### 2. **MongoDB Database**
- [ ] Create new database `jjtextiles_maternity_db`
- [ ] Use existing database (shared data)

### 3. **PhonePe Merchant**
- [ ] Create new PhonePe merchant account
- [ ] Reuse existing merchant account

### 4. **Email Account**
- [ ] Create new email account (info.jjtextiles@gmail.com)
- [ ] Reuse existing email account

---

## 🔍 Verification Checklist

After setup, verify:

- [ ] `backend/.env` exists and has all values filled
- [ ] `frontend/.env.production` exists and has Firebase config
- [ ] `admin/.env` exists and has API URL
- [ ] Firebase Admin SDK JSON file exists (if using)
- [ ] MongoDB connection works (test with mongosh)
- [ ] All directories created with proper permissions
- [ ] Dependencies installed (npm install completed)
- [ ] Projects built successfully (npm run build)
- [ ] PM2 services start without errors

---

## 🚨 Common Issues

**Issue: Permission denied**
```bash
sudo chown -R $USER:$USER /var/www/jjtextiles-ecom
```

**Issue: MongoDB connection fails**
```bash
# Test connection
mongosh "mongodb://your_connection_string"
```

**Issue: Firebase Admin SDK not found**
```bash
# Check file exists
ls -la /var/www/jjtextiles-ecom/backend/*firebase*.json
# Verify path in .env matches actual filename
```

**Issue: PM2 won't start**
```bash
pm2 logs
# Check for specific errors
```

---

For detailed explanations, see `ENV_SETUP_GUIDE.md`

