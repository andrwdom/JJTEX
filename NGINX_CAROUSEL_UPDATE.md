# Nginx Configuration Update for Carousel Images

## Current Situation

Your Nginx configuration already has a `/images/` location block that should serve carousel images. However, you need to verify the path matches your actual `UPLOAD_PATH` environment variable.

## Path Verification

Check which path your backend is actually using:

```bash
# On your VPS, check the .env file
cat /var/www/jjtextiles/JJTEX/backend/.env | grep UPLOAD_PATH

# Or check where carousel images are actually stored
ls -la /var/www/jjtextiles/JJTEX/uploads/carousel/
# OR
ls -la /var/www/jjtextiles-ecom/uploads/carousel/
```

## Nginx Configuration Update

### Option 1: If using `/var/www/jjtextiles-ecom/uploads/`

Your current Nginx config should already work. Just verify the path exists:

```bash
sudo ls -la /var/www/jjtextiles-ecom/uploads/carousel/
```

### Option 2: If using `/var/www/jjtextiles/JJTEX/uploads/`

Update your Nginx config file (usually at `/etc/nginx/sites-available/jjtextiles` or similar):

**For Main Site (jjtextiles.com):**
```nginx
location ^~ /images/ {
    alias /var/www/jjtextiles/JJTEX/uploads/;
    expires 30d;
    add_header Cache-Control "public, max-age=2592000" always;
    add_header Vary "Accept" always;
    access_log off;
}
```

**For Admin Panel (admin.jjtextiles.com):**
```nginx
location ^~ /images/ {
    alias /var/www/jjtextiles/JJTEX/uploads/;
    add_header Cache-Control "public, max-age=2592000" always;
    add_header Vary "Accept" always;
    expires 30d;
}
```

## Steps to Apply

1. **Verify the actual path:**
   ```bash
   # Check where carousel images are stored
   find /var/www -name "carousel" -type d 2>/dev/null
   ```

2. **Update Nginx config** (if needed):
   ```bash
   sudo nano /etc/nginx/sites-available/jjtextiles
   # Or wherever your active config is
   ```

3. **Test the configuration:**
   ```bash
   sudo nginx -t
   ```

4. **Reload Nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

5. **Verify carousel images are accessible:**
   ```bash
   # Test if an image is accessible (replace with actual filename)
   curl -I https://jjtextiles.com/images/carousel/product-1767416253241-279649212.jpg
   ```

## Important Notes

- The `/images/` location block in Nginx should match your `UPLOAD_PATH` environment variable
- Carousel images are stored at: `[UPLOAD_PATH]/carousel/[filename]`
- They are served via: `https://jjtextiles.com/images/carousel/[filename]`
- Make sure the directory has proper permissions:
  ```bash
  sudo chown -R www-data:www-data /var/www/jjtextiles/JJTEX/uploads/carousel/
  sudo chmod -R 755 /var/www/jjtextiles/JJTEX/uploads/carousel/
  ```

## Troubleshooting

If images still don't load:

1. **Check Nginx error logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

2. **Check file permissions:**
   ```bash
   ls -la /var/www/jjtextiles/JJTEX/uploads/carousel/
   ```

3. **Test direct file access:**
   ```bash
   # Should return image data
   curl https://jjtextiles.com/images/carousel/product-1767416253241-279649212.jpg
   ```

4. **Verify the alias path:**
   ```bash
   # The alias should point to the directory containing the 'carousel' folder
   # NOT the carousel folder itself
   ```

