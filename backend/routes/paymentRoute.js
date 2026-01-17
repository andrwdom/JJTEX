import express from 'express';
import { 
    createPhonePeSession, 
    phonePeCallback, 
    verifyPhonePePayment,
    dummyPaymentSuccess,
    getPaymentStatus,
    getOrderByTransactionId // 🔑 ADDED: Import the new controller function
} from '../controllers/paymentController.js';
import { verifyToken, optionalAuth } from '../middleware/auth.js';
// Add imports for refund and webhook controllers
import { initiatePhonePeRefund, getPhonePeRefundStatus } from '../controllers/refundController.js';
import { phonePeWebhookHandler } from '../controllers/enhancedWebhookController.js';

const paymentRouter = express.Router();

// PhonePe payment routes
paymentRouter.post('/phonepe/create-session', optionalAuth, createPhonePeSession);
paymentRouter.post('/phonepe/callback', phonePeCallback);
paymentRouter.post('/phonepe/dummy-success', verifyToken, dummyPaymentSuccess);
paymentRouter.get('/phonepe/verify/:merchantTransactionId', optionalAuth, verifyPhonePePayment);

// 🔑 NEW: Endpoint for frontend to fetch order details securely after payment
paymentRouter.get('/order/:transactionId', optionalAuth, getOrderByTransactionId);

// Payment status endpoint
paymentRouter.get('/status/:sessionId', optionalAuth, getPaymentStatus);
// PhonePe refund routes
paymentRouter.post('/phonepe/refund', verifyToken, initiatePhonePeRefund);
paymentRouter.get('/phonepe/refund-status/:merchantRefundId', verifyToken, getPhonePeRefundStatus);
// PhonePe webhook route
paymentRouter.post('/phonepe/webhook', phonePeWebhookHandler);

// 🚨 SECURITY: Never expose "mark paid" / "simulate callback" routes in production.
// These routes are useful for staging and internal testing ONLY.
if (process.env.NODE_ENV !== 'production') {
  // Test endpoint to manually mark order as paid
  paymentRouter.post('/phonepe/test-success/:merchantTransactionId', verifyToken, async (req, res) => {
    try {
      const { merchantTransactionId } = req.params;
      console.log('Test success request for transaction:', merchantTransactionId);
      
      const order = await (await import('../models/orderModel.js')).default.findOne({
        phonepeTransactionId: merchantTransactionId
      });
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          merchantTransactionId
        });
      }
      
      // Mark as paid (testing only)
      await (await import('../models/orderModel.js')).default.findByIdAndUpdate(order._id, {
        payment: true,
        paymentStatus: 'PAID',
        orderStatus: 'CONFIRMED',
        status: 'CONFIRMED',
        updatedAt: new Date()
      });
      
      return res.json({
        success: true,
        message: 'Order marked as paid successfully (test only)',
        orderId: order._id
      });
    } catch (error) {
      console.error('Test success endpoint error:', error);
      res.status(500).json({
        success: false,
        message: 'Test success failed',
        error: error.message
      });
    }
  });

  // Manual callback simulation endpoint
  paymentRouter.post('/phonepe/simulate-callback/:merchantTransactionId', verifyToken, async (req, res) => {
    try {
      const { merchantTransactionId } = req.params;
      const { state = 'COMPLETED' } = req.body;
      
      console.log('Simulating callback for transaction:', merchantTransactionId, 'with state:', state);
      
      // Find the order
      const order = await (await import('../models/orderModel.js')).default.findOne({
        phonepeTransactionId: merchantTransactionId
      });
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
          merchantTransactionId
        });
      }
      
      // Simulate callback processing
      const isSuccess = (
        state === 'checkout.order.completed' ||
        state === 'COMPLETED' ||
        state === 'SUCCESS' ||
        state === 'PAYMENT_SUCCESS' ||
        state === 'SUCCESSFUL' ||
        state === 'PAID'
      );
      
      let update = {
        paymentLog: { simulated: true, state },
        phonepeTransactionId: merchantTransactionId,
        updatedAt: new Date()
      };
      
      if (isSuccess) {
        update = {
          ...update,
          payment: true,
          paymentStatus: 'PAID',
          orderStatus: 'CONFIRMED',
          status: 'CONFIRMED',
        };
      } else {
        update = {
          ...update,
          paymentStatus: 'FAILED',
          orderStatus: 'CANCELLED',
          status: 'CANCELLED',
        };
      }
      
      await (await import('../models/orderModel.js')).default.findByIdAndUpdate(order._id, update);
      
      return res.json({
        success: true,
        message: `Order ${isSuccess ? 'marked as PAID' : 'marked as FAILED'} successfully (test only)`,
        orderId: order._id,
        state: state,
        isSuccess: isSuccess
      });
    } catch (error) {
      console.error('Simulate callback error:', error);
      res.status(500).json({
        success: false,
        message: 'Simulate callback failed',
        error: error.message
      });
    }
  });
}

export default paymentRouter; 