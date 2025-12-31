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

  // Ensure items are properly mapped with all fields
  // Handle both productId and _id fields (checkout session may use either)
  const mappedItems = (s.items || []).map((item) => {
    const productId = item.productId || item._id;
    return {
      productId: productId ? (productId.toString ? productId.toString() : productId) : null,
      name: item.name || 'Unknown Product',
      price: item.price || 0,
      quantity: item.quantity || 1,
      size: item.size || '',
      image: item.image || null
    };
  });

  // Log items for debugging
  console.log('📦 [Order] Mapping items from checkout session:', {
    sessionId: s.sessionId,
    itemsCount: s.items?.length || 0,
    mappedItemsCount: mappedItems.length,
    sampleItem: mappedItems[0]
  });

  const order = new orderModel({
    checkoutSessionId: s.sessionId,
    source: s.source,
    userInfo: s.userId ? { userId: s.userId, email: s.userEmail } : { email: s.userEmail },
    shippingInfo: s.shippingInfo || {},
    // Populate both cartItems and items for maximum compatibility
    cartItems: mappedItems,
    items: mappedItems.map(item => ({
      name: item.name || 'Unknown Product',
      quantity: item.quantity || 1,
      price: item.price || 0,
      image: item.image || null,
      size: item.size || ''
    })),
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

  // Validate that session has items
  if (!s.items || s.items.length === 0) {
    console.error('❌ [COD Order] Checkout session has no items!', {
      sessionId: s.sessionId,
      sessionData: {
        source: s.source,
        total: s.total,
        subtotal: s.subtotal,
        items: s.items,
        itemsLength: s.items?.length
      }
    });
    throw new Error('Checkout session has no items. Cannot create order.');
  }

  // Idempotency: one order per checkout session
  const existingBySession = await orderModel.findOne({ checkoutSessionId: sessionId });
  if (existingBySession) {
    console.log('📦 [COD Order] Order already exists for this session:', existingBySession.orderId);
    return existingBySession;
  }

  // Generate unique order ID
  const orderId = await generateUniqueOrderId();

  // Merge shipping info from request with session data
  const finalShippingInfo = {
    ...(s.shippingInfo || {}),
    ...(shippingInfo || {})
  };

  // Ensure items are properly mapped with all fields
  const mappedItems = (s.items || []).map(({ productId, name, price, quantity, size, image }) => ({ 
    productId, 
    name, 
    price, 
    quantity, 
    size,
    image: image || null
  }));

  // Log items for debugging
  console.log('📦 [COD Order] Mapping items from checkout session:', {
    sessionId: s.sessionId,
    itemsCount: s.items?.length || 0,
    items: s.items,
    mappedItemsCount: mappedItems.length,
    mappedItems
  });

  if (mappedItems.length === 0) {
    console.error('⚠️ [COD Order] WARNING: No items found in checkout session!', {
      sessionId: s.sessionId,
      sessionItems: s.items,
      sessionData: {
        source: s.source,
        total: s.total,
        subtotal: s.subtotal
      }
    });
  }

  const order = new orderModel({
    checkoutSessionId: s.sessionId,
    source: s.source,
    userInfo: s.userId ? { userId: s.userId, email: s.userEmail } : { email: s.userEmail },
    shippingInfo: finalShippingInfo,
    // Populate both cartItems and items for maximum compatibility
    cartItems: mappedItems,
    items: mappedItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image,
      size: item.size
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


