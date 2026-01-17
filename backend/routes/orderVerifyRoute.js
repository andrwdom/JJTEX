/**
 * PhonePe Dashboard Callback Alias
 *
 * Your PhonePe dashboard is configured with:
 *   /api/order/verify-phonepe
 *
 * Historically the codebase used /api/payment/phonepe/callback and/or frontend-driven verification.
 * This route ensures dashboard callbacks keep working without needing Nginx rewrites.
 */

import express from 'express';
import { phonePeCallback } from '../controllers/paymentController.js';

const router = express.Router();

// PhonePe server-to-server callback (dashboard-configured)
router.post('/verify-phonepe', phonePeCallback);

export default router;

