# Carousel Banner VPS Setup Guide

## Directory Structure

Carousel images are stored on the VPS in the following directory structure:

```
/var/www/jjtextiles/JJTEX/uploads/
└── carousel/
    ├── banner-1-1234567890-987654321.jpg
    ├── banner-2-1234567891-987654322.png
    └── ...
```

## Environment Variables

Make sure your `.env` file includes:

```env
# Upload path for VPS
UPLOAD_PATH=/var/www/jjtextiles/JJTEX/uploads

# Base URL for image serving
BASE_URL=https://jjtextiles.in
# OR
NEXT_PUBLIC_API_URL=https://jjtextiles.in
```

## VPS Directory Setup

### 1. Create Directory Structure

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Create the uploads directory structure
sudo mkdir -p /var/www/jjtextiles/JJTEX/uploads/carousel

# Set proper ownership (replace 'your-user' with your actual user)
sudo chown -R your-user:your-user /var/www/jjtextiles/JJTEX/uploads

# Set proper permissions
sudo chmod -R 755 /var/www/jjtextiles/JJTEX/uploads
```

### 2. Nginx Configuration

Ensure your Nginx configuration includes the following to serve images:

```nginx
server {
    listen 80;
    server_name jjtextiles.in www.jjtextiles.in;

    # Serve carousel images
    location /images/carousel/ {
        alias /var/www/jjtextiles/JJTEX/uploads/carousel/;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # Serve all uploads
    location /images/ {
        alias /var/www/jjtextiles/JJTEX/uploads/;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. Verify Permissions

```bash
# Check directory permissions
ls -la /var/www/jjtextiles/JJTEX/uploads/

# Should show:
# drwxr-xr-x  your-user your-user  carousel/
```

### 4. Test Image Upload

After setting up, test by uploading a carousel banner through the admin panel. The image should be saved to:
- `/var/www/jjtextiles/JJTEX/uploads/carousel/[filename]`

And accessible via:
- `https://jjtextiles.in/images/carousel/[filename]`

## Troubleshooting

### Images not uploading
- Check directory permissions: `ls -la /var/www/jjtextiles/JJTEX/uploads/carousel/`
- Check Node.js process has write access
- Check disk space: `df -h`

### Images not displaying
- Verify Nginx configuration is correct
- Check image URLs in browser console
- Verify BASE_URL environment variable matches your domain

### Permission denied errors
```bash
# Fix ownership
sudo chown -R $USER:$USER /var/www/jjtextiles/JJTEX/uploads

# Fix permissions
sudo chmod -R 755 /var/www/jjtextiles/JJTEX/uploads
```

