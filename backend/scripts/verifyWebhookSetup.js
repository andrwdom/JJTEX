#!/usr/bin/env node

/**
 * WEBHOOK SETUP VERIFICATION SCRIPT
 * 
 * Verifies that the bulletproof webhook system is properly configured
 * and ready for production use.
 * 
 * Usage: node backend/scripts/verifyWebhookSetup.js
 */

import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const backendDir = join(__dirname, '..');

class WebhookSetupVerifier {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.success = [];
  }

  async verify() {
    console.log('🔍 VERIFYING BULLETPROOF WEBHOOK SETUP...\n');

    // 1. Check environment variables
    this.checkEnvironmentVariables();

    // 2. Check file structure
    this.checkFileStructure();

    // 3. Check route configuration
    this.checkRouteConfiguration();

    // 4. Check PhonePe dashboard configuration
    this.checkPhonePeDashboardConfig();

    // 5. Generate report
    this.generateReport();
  }

  checkEnvironmentVariables() {
    console.log('📋 Checking Environment Variables...');

    const requiredVars = [
      'PHONEPE_CALLBACK_USERNAME',
      'PHONEPE_CALLBACK_PASSWORD',
      'PHONEPE_MERCHANT_ID',
      'PHONEPE_API_KEY',
      'MONGODB_URI'
    ];

    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (!value) {
        this.issues.push(`❌ Missing environment variable: ${varName}`);
      } else {
        this.success.push(`✅ ${varName} is configured`);
      }
    }

    // Check webhook credentials specifically
    const username = process.env.PHONEPE_CALLBACK_USERNAME;
    const password = process.env.PHONEPE_CALLBACK_PASSWORD;

    if (username && password) {
      this.success.push(`✅ Webhook credentials configured (${username}:***)`);
    } else {
      this.issues.push('❌ PhonePe webhook credentials not configured');
    }

    console.log('   Environment variables checked\n');
  }

  checkFileStructure() {
    console.log('📁 Checking File Structure...');

    const requiredFiles = [
      'controllers/enhancedWebhookController.js',
      'services/bulletproofWebhookService.js',
      'routes/webhookMonitoring.js',
      'routes/paymentRoute.js',
      'scripts/webhookRecovery.js',
      'scripts/testWebhookSystem.js',
      'utils/enhancedLogger.js'
    ];

    for (const file of requiredFiles) {
      const filePath = join(backendDir, file);
      if (existsSync(filePath)) {
        this.success.push(`✅ ${file} exists`);
      } else {
        this.issues.push(`❌ Missing file: ${file}`);
      }
    }

    console.log('   File structure checked\n');
  }

  checkRouteConfiguration() {
    console.log('🛣️ Checking Route Configuration...');

    try {
      // Check payment route configuration
      const paymentRoutePath = join(backendDir, 'routes/paymentRoute.js');
      if (existsSync(paymentRoutePath)) {
        const paymentRouteContent = readFileSync(paymentRoutePath, 'utf8');
        
        if (paymentRouteContent.includes("import { phonePeWebhookHandler } from '../controllers/enhancedWebhookController.js'")) {
          this.success.push('✅ Payment route uses enhanced webhook handler');
        } else if (paymentRouteContent.includes("import { phonePeWebhookHandler } from '../controllers/webhookController.js'")) {
          this.issues.push('❌ Payment route still uses OLD webhook handler');
        } else {
          this.warnings.push('⚠️ Cannot verify webhook handler import in payment route');
        }

        if (paymentRouteContent.includes("paymentRouter.post('/phonepe/webhook', phonePeWebhookHandler)")) {
          this.success.push('✅ PhonePe webhook route configured at /phonepe/webhook');
        } else {
          this.issues.push('❌ PhonePe webhook route not found');
        }
      } else {
        this.issues.push('❌ Payment route file not found');
      }

      // Check server.js mounting
      const serverPath = join(backendDir, 'server.js');
      if (existsSync(serverPath)) {
        const serverContent = readFileSync(serverPath, 'utf8');
        
        if (serverContent.includes("app.use('/api/payment', strictLimiter, paymentRouter)")) {
          this.success.push('✅ Payment router mounted at /api/payment');
        } else {
          this.warnings.push('⚠️ Cannot verify payment router mounting');
        }

        if (serverContent.includes("import webhookMonitoringRouter")) {
          this.success.push('✅ Webhook monitoring routes available');
        } else {
          this.warnings.push('⚠️ Webhook monitoring routes may not be available');
        }
      }

    } catch (error) {
      this.issues.push(`❌ Error checking route configuration: ${error.message}`);
    }

    console.log('   Route configuration checked\n');
  }

  checkPhonePeDashboardConfig() {
    console.log('🔧 Checking PhonePe Dashboard Configuration...');

    const username = process.env.PHONEPE_CALLBACK_USERNAME;
    const password = process.env.PHONEPE_CALLBACK_PASSWORD;
    const baseUrl = process.env.BASE_URL || process.env.FRONTEND_URL || 'https://jjtextiles.in';

    const expectedWebhookUrl = `${baseUrl}/api/payment/phonepe/webhook`;

    console.log('   Expected PhonePe Dashboard Configuration:');
    console.log(`   📍 Webhook URL: ${expectedWebhookUrl}`);
    
    if (username && password) {
      console.log(`   🔐 Username: ${username}`);
      console.log(`   🔐 Password: ${password}`);
      this.success.push('✅ Webhook credentials ready for PhonePe dashboard');
    } else {
      this.issues.push('❌ Webhook credentials not configured for PhonePe dashboard');
    }

    // Check if HTTPS is configured
    if (baseUrl.startsWith('https://')) {
      this.success.push('✅ Using HTTPS for webhook URL');
    } else {
      this.warnings.push('⚠️ Webhook URL should use HTTPS for production');
    }

    console.log('   PhonePe dashboard configuration checked\n');
  }

  generateReport() {
    console.log('📊 VERIFICATION REPORT');
    console.log('='.repeat(50));

    console.log(`\n✅ SUCCESSES (${this.success.length}):`);
    this.success.forEach(item => console.log(`  ${item}`));

    if (this.warnings.length > 0) {
      console.log(`\n⚠️ WARNINGS (${this.warnings.length}):`);
      this.warnings.forEach(item => console.log(`  ${item}`));
    }

    if (this.issues.length > 0) {
      console.log(`\n❌ CRITICAL ISSUES (${this.issues.length}):`);
      this.issues.forEach(item => console.log(`  ${item}`));
    }

    console.log('\n' + '='.repeat(50));

    if (this.issues.length === 0) {
      console.log('🎉 WEBHOOK SYSTEM VERIFICATION PASSED!');
      console.log('\n✅ Your bulletproof webhook system is ready for production!');
      console.log('\n📋 NEXT STEPS:');
      console.log('1. Configure PhonePe dashboard with the webhook URL and credentials shown above');
      console.log('2. Deploy your changes to production');
      console.log('3. Test with a real payment');
      console.log('4. Monitor webhook health at /api/webhook-monitoring/health');
    } else {
      console.log('🚨 WEBHOOK SYSTEM HAS CRITICAL ISSUES!');
      console.log('\n❌ Fix the issues above before deploying to production.');
      console.log('\n📋 IMMEDIATE ACTION REQUIRED:');
      console.log('1. Fix all critical issues listed above');
      console.log('2. Re-run this verification script');
      console.log('3. Only deploy after all issues are resolved');
    }

    console.log('\n🔍 To test the webhook system:');
    console.log('  node backend/scripts/testWebhookSystem.js');
    console.log('\n🛠️ To recover failed webhooks:');
    console.log('  node backend/scripts/webhookRecovery.js --dry-run');
    console.log('\n📈 To monitor webhook health:');
    console.log('  curl http://localhost:4000/api/webhook-monitoring/health');

    return this.issues.length === 0;
  }
}

// Run verification
const verifier = new WebhookSetupVerifier();
verifier.verify()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  });
