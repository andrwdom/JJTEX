import productModel from "../models/productModel.js"
import ShippingRules from "../models/ShippingRules.js"

/**
 * Calculate shipping cost based on cart items and shipping location
 *
 * Maternity-specific logic has been removed. Shipping is now:
 * - Calculated per category (by Product.categorySlug) using ShippingRules when present
 * - Falls back to a simple default rule when no ShippingRules exist for that category
 */
export const calculateShipping = async (req, res) => {
    try {
        const { items, shippingInfo } = req.body;
        
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ 
                success: false, 
                message: "Items array is required" 
            });
        }

        if (!shippingInfo || !shippingInfo.state) {
            return res.status(400).json({ 
                success: false, 
                message: "Shipping information is required" 
            });
        }

        // Fetch product details for all items to get category information
        const productIds = [...new Set(items.map(item => item._id))];
        const products = await productModel.find({ _id: { $in: productIds } });
        
        // Create a map for quick lookup
        const productMap = {};
        products.forEach(product => {
            productMap[product._id.toString()] = product;
        });

        // Normalize state
        const normalizedState = String(shippingInfo.state || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '');

        const isTamilNadu = ['tamilnadu', 'tamilnaadu', 'tamil', 'puducherry', 'pondicherry', 'pondichery', 'pudhucherry'].includes(normalizedState);

        // Group quantities by product.categorySlug (preferred) or product.category (fallback)
        const categoryQuantities = {};
        let totalItems = 0;

        for (const item of items) {
            const product = productMap[item._id];
            const categoryKey = product?.categorySlug || product?.category || item.categorySlug || item.category;
            if (!categoryKey) continue;
            categoryQuantities[categoryKey] = (categoryQuantities[categoryKey] || 0) + (item.quantity || 0);
            totalItems += (item.quantity || 0);
        }

        // Calculate shipping per category using ShippingRules when available; fallback otherwise.
        let shippingCost = 0;
        const shippingDetails = [];

        for (const [categoryKey, quantity] of Object.entries(categoryQuantities)) {
            const rule = await ShippingRules.findOne({ category: categoryKey, isActive: true });

            if (rule) {
                const result = await ShippingRules.calculateShipping(categoryKey, quantity, shippingInfo.state);
                if (result) {
                    shippingCost += result.shippingCost;
                    shippingDetails.push({
                        category: rule.categoryName,
                        categoryKey,
                        quantity,
                        shippingCost: result.shippingCost,
                        message: result.shippingMessage
                    });
                }
            } else {
                // Default fallback:
                // - TN/Puducherry: free shipping
                // - Other states: 1→39, 2→59, 3→89, 4+→105
                let fallbackCost = 0;
                if (!isTamilNadu) {
                    if (quantity === 1) fallbackCost = 39;
                    else if (quantity === 2) fallbackCost = 59;
                    else if (quantity === 3) fallbackCost = 89;
                    else fallbackCost = 105;
                }
                shippingCost += fallbackCost;
                shippingDetails.push({
                    category: categoryKey,
                    categoryKey,
                    quantity,
                    shippingCost: fallbackCost,
                    message: fallbackCost === 0 ? 'Free shipping' : `₹${fallbackCost} shipping for ${quantity} item${quantity > 1 ? 's' : ''}`
                });
            }
        }

        const isFreeShipping = shippingCost === 0;
        const shippingMessage = isFreeShipping ? 'Free shipping!' : `₹${shippingCost} total shipping`;

        const response = {
            success: true,
            data: {
                shippingCost,
                isFreeShipping,
                shippingMessage,
                isTamilNadu,
                // Debug information
                totalItems,
                categoryQuantities,
                shippingDetails
            }
        };

        res.json(response);

    } catch (error) {
        console.error('Calculate Shipping Error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
}; 