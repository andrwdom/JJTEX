import CheckoutSession from '../models/CheckoutSession.js';
import orderModel from '../models/orderModel.js';

// Helper function to generate unique order ID (matches orderController format)
function generateRandomOrderId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

async function generateUniqueOrderId() {
  let orderId;
  let exists = true;
  let attempts = 0;
  while (exists && attempts < 10) {
    orderId = generateRandomOrderId();
    exists = await orderModel.exists({ orderId });
    attempts++;
  }
  if (exists) {
    throw new Error('Failed to generate unique order ID after multiple attempts');
  }
  return orderId;
}

/**
 * Create an Order from a CheckoutSession snapshot (idempotent).
 * Returns existing order if already created for this session or transaction.
 */
export async function createOrderFromCheckoutSession(sessionId, { paymentStatus, phonepeTransactionId, providerPayload } = {}) {
  const s = await CheckoutSession.findOne({ sessionId });
  if (!s) throw new Error('CheckoutSession not found');
  if (paymentStatus !== 'success') throw new Error('Cannot create order from failed payment');

  // Idempotency: one order per checkout session or per gateway transaction
  const existingBySession = await orderModel.findOne({ checkoutSessionId: sessionId });
  if (existingBySession) return existingBySession;
  if (phonepeTransactionId) {
    const existingByTxn = await orderModel.findOne({ phonepeTransactionId });
    if (existingByTxn) return existingByTxn;
  }

  const order = new orderModel({
    checkoutSessionId: s.sessionId,
    source: s.source,
    userInfo: s.userId ? { userId: s.userId, email: s.userEmail } : { email: s.userEmail },
    shippingInfo: s.shippingInfo || {},
    cartItems: s.items.map(({ productId, name, price, quantity, size }) => ({ productId, name, price, quantity, size })),
    subtotal: s.subtotal,
    total: s.total,
    paymentStatus: 'paid',
    orderStatus: 'Confirmed',
    placedAt: new Date(),
    phonepeTransactionId,
    status: 'Order Placed',
    metadata: { providerPayload }
  });
  await order.save();

  // Mark session as paid (best-effort)
  try {
    s.status = 'completed';
    await s.save();
  } catch {}

  return order;
}

/**
 * Create a COD (Cash on Delivery) Order from a CheckoutSession snapshot.
 * For COD orders, paymentStatus is PENDING and orderStatus is PENDING_CONFIRMATION.
 */
export async function createCODOrderFromCheckoutSession(sessionId, shippingInfo) {
  const s = await CheckoutSession.findOne({ sessionId });
  if (!s) throw new Error('CheckoutSession not found');

  // Idempotency: one order per checkout session
  const existingBySession = await orderModel.findOne({ checkoutSessionId: sessionId });
  if (existingBySession) return existingBySession;

  // Generate unique order ID
  const orderId = await generateUniqueOrderId();

  // Merge shipping info from request with session data
  const finalShippingInfo = {
    ...(s.shippingInfo || {}),
    ...(shippingInfo || {})
  };

  const order = new orderModel({
    checkoutSessionId: s.sessionId,
    source: s.source,
    userInfo: s.userId ? { userId: s.userId, email: s.userEmail } : { email: s.userEmail },
    shippingInfo: finalShippingInfo,
    cartItems: s.items.map(({ productId, name, price, quantity, size }) => ({ 
      productId, 
      name, 
      price, 
      quantity, 
      size 
    })),
    subtotal: s.subtotal,
    total: s.total,
    paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    orderStatus: 'PENDING',
    status: 'PENDING',
    placedAt: new Date(),
    orderId,
    // Apply coupon if exists
    couponUsed: s.discount?.appliedCouponCode ? {
      code: s.discount.appliedCouponCode,
      discount: s.discount.value || 0
    } : null,
    discount: s.discount || null,
    offerDetails: s.offerDetails || null,
    shippingCost: s.shippingCost || 0
  });
  
  await order.save();

  // Mark session as completed
  try {
    s.status = 'completed';
    await s.save();
  } catch {}

  return order;
}

export default { createOrderFromCheckoutSession, createCODOrderFromCheckoutSession };


