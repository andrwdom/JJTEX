#!/bin/bash
# Commands to check Nginx configuration on VPS

echo "=== Finding Active Nginx Config Files ==="
echo ""

# Check which config files exist
echo "1. Checking sites-available:"
ls -la /etc/nginx/sites-available/ | grep -i jjtextiles

echo ""
echo "2. Checking sites-enabled (active configs):"
ls -la /etc/nginx/sites-enabled/ | grep -i jjtextiles

echo ""
echo "3. Checking conf.d:"
ls -la /etc/nginx/conf.d/ | grep -i jjtextiles

echo ""
echo "=== Viewing Main Nginx Config ==="
echo ""
echo "Main config file:"
cat /etc/nginx/nginx.conf | grep -E "include|sites-enabled|conf.d" | head -5

echo ""
echo "=== Viewing Active Site Config ==="
echo ""
echo "If you have jjtextiles config, run:"
echo "cat /etc/nginx/sites-available/jjtextiles"
echo "OR"
echo "cat /etc/nginx/sites-enabled/jjtextiles"
echo ""
echo "=== Viewing /images/ Location Block ==="
echo ""
echo "To see the /images/ location block, run:"
echo "grep -A 10 'location.*images' /etc/nginx/sites-available/jjtextiles"
echo "OR"
echo "grep -A 10 'location.*images' /etc/nginx/sites-enabled/jjtextiles"

