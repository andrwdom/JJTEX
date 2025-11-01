# 🔧 Environment Configuration Setup Guide - JJTextiles

This guide will help you set up all environment variables for the new JJTextiles site.

## 📋 Checklist of Things to Configure

### 1. **Frontend Environment** (`frontend/.env` or `frontend/.env.production`)
- API URL
- Firebase configuration (new Firebase project or reuse existing?)
- Site URL

### 2. **Backend Environment** (`backend/.env`)
- MongoDB connection (new database or same?)
- JWT Secret (generate new one)
- Admin credentials
- PhonePe credentials (new merchant or reuse?)
- Firebase Admin SDK path
- Email configuration
- CORS origin
- Redis configuration
- File upload paths
- Various service URLs

### 3. **Admin Environment** (`admin/.env`)
- API URL

### 4. **Additional Setup**
- Firebase Admin SDK JSON file path
- File upload directories
- SSL certificates (if using different domain)

---

## 🚀 Step-by-Step Setup

### Step 1: Frontend Environment

```bash
cd /var/www/jjtextiles-ecom/frontend
nano .env.production
```

**Template:**
```env
NEXT_PUBLIC_API_URL=https://jjtextiles.in
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=jjtextiles-ecom.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=jjtextiles-ecom
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=jjtextiles-ecom.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID
NEXT_PUBLIC_SITE_URL=https://jjtextiles.in
NODE_ENV=production
```

**Decisions Needed:**
- [ ] Create new Firebase project OR reuse existing one?
- [ ] If new: Create Firebase project and get new credentials
- [ ] If reuse: Copy existing Firebase credentials

---

### Step 2: Backend Environment

```bash
cd /var/www/jjtextiles-ecom/backend
nano .env
```

**Full Template - See `backend/.env.template` file**

**Key Decisions:**
- [ ] **MongoDB Database**: New database `jjtextiles_maternity_db` OR same database?
- [ ] **JWT Secret**: Generate new secure secret
- [ ] **Admin Credentials**: New admin email and password
- [ ] **PhonePe**: New merchant account OR reuse existing?
- [ ] **Firebase Admin SDK**: New file path OR copy existing file?
- [ ] **Email**: New email account OR reuse existing?
- [ ] **File Paths**: Update all paths to `/var/www/jjtextiles-ecom`

---

### Step 3: Admin Environment

```bash
cd /var/www/jjtextiles-ecom/admin
nano .env
```

```env
VITE_API_URL=https://jjtextiles.in
NODE_ENV=production
```

---

### Step 4: Firebase Admin SDK Setup

**Option A: Create New Firebase Project**
1. Go to Firebase Console
2. Create new project: `jjtextiles-ecom`
3. Enable Authentication
4. Download Admin SDK JSON file
5. Upload to VPS: `/var/www/jjtextiles-ecom/backend/jjtextiles-ecom-firebase-adminsdk-*.json`

**Option B: Reuse Existing Firebase Project**
```bash
# Copy existing Firebase Admin SDK file
cp /var/www/shithaa-ecom/backend/shithaa-ecom-firebase-adminsdk-*.json \
   /var/www/jjtextiles-ecom/backend/jjtextiles-ecom-firebase-adminsdk-*.json

# Update permissions
chmod 600 /var/www/jjtextiles-ecom/backend/jjtextiles-ecom-firebase-adminsdk-*.json
```

**Then update `GOOGLE_APPLICATION_CREDENTIALS` in backend/.env**

---

### Step 5: MongoDB Setup

**Option A: Create New Database**
```bash
# Connect to MongoDB
mongosh

# Create new database
use jjtextiles_maternity_db

# Create user (if needed)
db.createUser({
  user: "jjtextiles",
  pwd: "your_secure_password",
  roles: [{ role: "readWrite", db: "jjtextiles_maternity_db" }]
})
```

**Option B: Use Same Database** (with different collections or shared data)
- Just update `MONGODB_URI` to point to existing database

---

### Step 6: Generate Secure Secrets

```bash
# Generate JWT Secret
openssl rand -base64 32

# Generate PhonePe webhook password
openssl rand -base64 24
```

---

### Step 7: File Permissions

```bash
# Create upload directories
mkdir -p /var/www/jjtextiles-ecom/uploads/products
mkdir -p /var/www/jjtextiles-ecom/uploads/temp
mkdir -p /var/www/jjtextiles-ecom/backend/logs
mkdir -p /var/www/jjtextiles-ecom/frontend/logs
mkdir -p /var/www/jjtextiles-ecom/admin/logs

# Set permissions
chown -R $USER:$USER /var/www/jjtextiles-ecom
chmod -R 755 /var/www/jjtextiles-ecom
chmod 600 /var/www/jjtextiles-ecom/backend/.env
chmod 600 /var/www/jjtextiles-ecom/frontend/.env.production
chmod 600 /var/www/jjtextiles-ecom/admin/.env
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Frontend `.env.production` created with correct values
- [ ] Backend `.env` created with correct values  
- [ ] Admin `.env` created with correct values
- [ ] Firebase Admin SDK file exists and path is correct
- [ ] MongoDB connection works (test with: `mongosh "mongodb://..."`)
- [ ] Upload directories exist and have correct permissions
- [ ] All file paths updated to `/var/www/jjtextiles-ecom`
- [ ] All URLs updated to `jjtextiles.in`
- [ ] JWT secret is secure and unique
- [ ] Admin credentials set and secure

---

## 🔐 Security Reminders

1. **Never commit `.env` files to git**
2. **Use strong, unique passwords**
3. **Set proper file permissions (600 for .env files)**
4. **Keep Firebase Admin SDK JSON files secure**
5. **Rotate secrets regularly**
6. **Use different credentials for production and staging**

---

## 📝 Quick Reference

**Environment File Locations:**
- Frontend: `/var/www/jjtextiles-ecom/frontend/.env.production`
- Backend: `/var/www/jjtextiles-ecom/backend/.env`
- Admin: `/var/www/jjtextiles-ecom/admin/.env`

**Test Configuration:**
```bash
# Test backend connection
cd /var/www/jjtextiles-ecom/backend
node -e "require('dotenv').config(); console.log('MongoDB:', process.env.MONGODB_URI ? 'Set' : 'Missing');"

# Test frontend build
cd /var/www/jjtextiles-ecom/frontend
npm run build
```

