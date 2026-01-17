/**
 * Reconciliation bootstrap
 *
 * IMPORTANT:
 * This file is imported by `server.js` and `startReconciliationCron()` is called on boot.
 * The previous implementation was a mock that ALWAYS returned PENDING, which can cause:
 * - Paid orders remaining stuck in DRAFT if user doesn't return to the site
 * - Reserved stock getting stuck and/or orders not being fulfilled despite payment
 *
 * We now delegate to the canonical reconciliation service which uses the official
 * PhonePe status API algorithm and `commitOrder()` for atomic stock/order finalization.
 */

import canonicalReconciliationService from '../services/canonicalReconciliationService.js';

/**
 * Start reconciliation (canonical, tiered, production-safe).
 *
 * The canonical service runs multiple tiers:
 * - Realtime (1 min) for recent drafts
 * - Near realtime (15 min)
 * - Daily (24 hours)
 */
export function startReconciliationCron() {
  // Keep the exported name for backward compatibility with `server.js`
  // but run the canonical service instead of cron-based mocks.
  canonicalReconciliationService.start().catch((err) => {
    console.error('❌ Failed to start canonical reconciliation service:', err?.message || err);
  });
}

// Manual reconciliation function for testing
export async function runManualReconciliation() {
  // If the service is already running, this is effectively a no-op.
  // (We keep this function for existing scripts / admin tooling.)
  await canonicalReconciliationService.start();
}

export default {
  startReconciliationCron,
  runManualReconciliation
};
