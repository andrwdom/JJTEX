import orderModel from "../models/orderModel.js";
import { sendOrderStatusUpdate, sendShippingNotification } from '../utils/emailService.js';

// Get all orders (admin only)
// Update order status
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status, shippingPartner, trackingId } = req.body;

        if (!orderId || !status) {
            return res.status(400).json({
                success: false,
                message: "Order ID and status are required"
            });
        }

        const validStatuses = ['DRAFT', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value"
            });
        }

        const updateData = { orderStatus: status };
        
        // Add shipping details if provided
        if (status === 'SHIPPED' && shippingPartner && trackingId) {
            updateData.shippingDetails = {
                partner: shippingPartner,
                trackingId: trackingId,
                shippedAt: new Date()
            };
        }

        const order = await orderModel.findByIdAndUpdate(
            orderId,
            updateData,
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Send email notification based on status
        // Extract customer email from various possible locations
        const customerEmail = order.shippingInfo?.email || 
                             order.userInfo?.email || 
                             order.email || 
                             order.shippingAddress?.email;
        
        if (!customerEmail) {
            console.warn('⚠️ No customer email found for order:', order.orderId || order._id);
        } else {
            // Get order items (support both cartItems and items)
            const orderItems = order.cartItems?.length ? order.cartItems : order.items || [];
            const formattedItems = orderItems.map(item => ({
                name: item.name || 'Product',
                size: item.size || '-',
                quantity: item.quantity || 1,
                price: item.price || 0
            }));

            // Get order total
            const orderTotal = order.totalAmount || 
                             order.total || 
                             order.totalPrice || 
                             order.amount || 
                             0;

            if (status === 'SHIPPED' && shippingPartner && trackingId) {
                // Format email data for shipping notification
                const shippingEmailData = {
                    to: customerEmail,
                    orderId: order.orderId || order._id.toString(),
                    trackingNumber: trackingId,
                    carrier: shippingPartner,
                    items: formattedItems,
                    amount: orderTotal
                };
                await sendShippingNotification(shippingEmailData);
            } else {
                // Format email data for status update
                const statusEmailData = {
                    to: customerEmail,
                    orderId: order.orderId || order._id.toString(),
                    status: status,
                    amount: orderTotal,
                    items: formattedItems,
                    trackingNumber: order.shippingDetails?.trackingId || order.shippingTracking?.trackingId || null,
                    estimatedDelivery: null // Can be added if available
                };
                await sendOrderStatusUpdate(statusEmailData);
            }
        }

        res.json({
            success: true,
            message: `Order status updated to ${status}`,
            order
        });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to update order status",
            error: error.message
        });
    }
};

export const getAllOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({})
            .sort({ createdAt: -1 })
            .select('-__v');

        res.json({ 
            success: true, 
            orders
        });

    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch orders",
            error: error.message 
        });
    }
};
