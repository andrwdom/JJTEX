# 🚀 VPS Setup Guide - New Folder for JJTextiles

This guide will help you create a new folder on your VPS and set up the JJTextiles project.

## Step 1: Create New Directory on VPS

SSH into your VPS and run:

```bash
# Create the new directory
mkdir -p /var/www/jjtextiles-ecom

# Set proper permissions
chown -R $USER:$USER /var/www/jjtextiles-ecom
```

## Step 2: Clone Repository into New Folder

```bash
# Navigate to /var/www
cd /var/www

# Clone your repository (replace with your actual repo URL)
git clone https://github.com/andrwdom/JJTEX.git jjtextiles-ecom

# Or if you want to clone from your local machine via SSH:
# First, push from local, then on VPS:
cd jjtextiles-ecom
```

## Step 3: Alternative - Push from Local and Pull on VPS

### On Your Local Machine (Current Directory):

```bash
# Make sure you're on the develop branch
git checkout develop

# Commit any pending changes (if any)
git add .
git commit -m "Rename project from shithaa to jjtextiles"

# Push to repository
git push origin develop
```

### On VPS:

```bash
# Navigate to the new directory
cd /var/www/jjtextiles-ecom

# Clone the repository
git clone https://github.com/andrwdom/JJTEX.git .

# Or if already cloned, pull latest changes
git pull origin develop
```

## Step 4: Install Dependencies

```bash
# Make sure you're in the project root
cd /var/www/jjtextiles-ecom

# Install root dependencies (if any)
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install admin dependencies
cd admin
npm install
cd ..
```

## Step 5: Create Required Directories

```bash
# Create necessary directories
mkdir -p /var/www/jjtextiles-ecom/backend/logs
mkdir -p /var/www/jjtextiles-ecom/frontend/logs
mkdir -p /var/www/jjtextiles-ecom/admin/logs
mkdir -p /var/www/jjtextiles-ecom/uploads
mkdir -p /var/www/jjtextiles-ecom/uploads/products
mkdir -p /var/www/jjtextiles-ecom/uploads/temp
```

## Step 6: Set Up Environment Variables

### Backend Environment (.env):

```bash
cd /var/www/jjtextiles-ecom/backend
nano .env
```

Add your environment variables (copy from your old setup or create new ones):
```env
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb://localhost:27017/jjtextiles
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=https://jjtextiles.in
VPS_BASE_URL=https://jjtextiles.in
FRONTEND_URL=https://jjtextiles.in
BASE_URL=https://jjtextiles.in
# ... other variables
```

### Frontend Environment:

```bash
cd /var/www/jjtextiles-ecom/frontend
nano .env.production
```

```env
NEXT_PUBLIC_API_URL=https://jjtextiles.in
NEXT_PUBLIC_SITE_URL=https://jjtextiles.in
NODE_ENV=production
```

### Admin Environment:

```bash
cd /var/www/jjtextiles-ecom/admin
nano .env
```

```env
VITE_API_URL=https://jjtextiles.in
NODE_ENV=production
```

## Step 7: Build Projects

```bash
# Build frontend
cd /var/www/jjtextiles-ecom/frontend
npm run build

# Build admin
cd ../admin
npm run build
```

## Step 8: Update Ecosystem Config (if needed)

The ecosystem.config.js should already have the new paths, but verify:

```bash
cd /var/www/jjtextiles-ecom
# Check ecosystem.config.js to ensure paths are correct
```

## Step 9: Start Services with PM2

```bash
cd /var/www/jjtextiles-ecom

# Start all services
pm2 start ecosystem.config.js

# Or start individually
pm2 start ecosystem.config.js --only jjtextiles-backend
pm2 start ecosystem.config.js --only jjtextiles-frontend
pm2 start ecosystem.config.js --only jjtextiles-admin

# Check status
pm2 status

# View logs
pm2 logs

# Save PM2 configuration
pm2 save
```

## Step 10: Set Up PM2 Startup (Auto-start on reboot)

```bash
# Generate startup script
pm2 startup

# Follow the command it outputs (usually something like):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root

# Save current PM2 process list
pm2 save
```

## Quick Reference Commands

### Pull Latest Changes:
```bash
cd /var/www/jjtextiles-ecom
git pull origin develop
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd frontend && npm run build && cd ..
pm2 reload all
```

### View Logs:
```bash
pm2 logs jjtextiles-backend
pm2 logs jjtextiles-frontend
pm2 logs jjtextiles-admin
```

### Restart Services:
```bash
pm2 restart all
# or
pm2 restart jjtextiles-backend
```

### Stop Services:
```bash
pm2 stop all
# or
pm2 delete all  # to remove from PM2
```

## Important Notes

1. **Database**: Make sure to update MongoDB database name from `shithaa-ecom` to `jjtextiles` or your preferred name
2. **File Paths**: Update any hardcoded paths in configuration files
3. **Nginx**: You'll need to update nginx configuration if you're using it
4. **Domain**: Make sure DNS is pointing to your new setup
5. **SSL Certificate**: If using Let's Encrypt, update for new domain

## Troubleshooting

If you encounter permission issues:
```bash
sudo chown -R $USER:$USER /var/www/jjtextiles-ecom
sudo chmod -R 755 /var/www/jjtextiles-ecom
```

If PM2 processes aren't starting:
```bash
pm2 logs
# Check for specific errors
```

For more detailed setup, see the deployment scripts in the repository root.

