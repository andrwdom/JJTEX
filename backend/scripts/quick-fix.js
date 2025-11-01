#!/usr/bin/env node

/**
 * Quick Fix Script
 * This script helps restart the backend after fixing syntax errors
 */

console.log('🚀 Quick Fix Script');
console.log('==================');
console.log('');
console.log('The syntax error has been fixed!');
console.log('');
console.log('Now run these commands on your VPS:');
console.log('');
console.log('1. Pull the latest changes:');
console.log('   git pull origin main');
console.log('');
console.log('2. Restart the backend:');
console.log('   pm2 restart jjtextiles-backend');
console.log('');
console.log('3. Check if it\'s working:');
console.log('   pm2 status');
console.log('');
console.log('4. Test the website:');
console.log('   curl https://jjtextiles.in/api/health');
console.log('');
console.log('✅ The backend should now work properly!');
