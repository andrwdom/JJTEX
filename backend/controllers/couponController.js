import Coupon from '../models/Coupon.js';

// Get all coupons (admin only)
export const getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        // Return as array for consistency
        res.status(200).json(coupons);
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch coupons',
            error: error.message 
        });
    }
};

// Create a new coupon (admin only)
export const createCoupon = async (req, res) => {
  try {
    const { code, discountPercentage, validFrom, validUntil, usageLimit } = req.body;
    
    // Validation
    if (!discountPercentage || discountPercentage < 1 || discountPercentage > 100) {
      return res.status(400).json({ 
        success: false,
        message: 'Discount percentage must be between 1 and 100' 
      });
    }
    
    if (!validFrom || !validUntil) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid from and valid until dates are required' 
      });
    }
    
    const fromDate = new Date(validFrom);
    const untilDate = new Date(validUntil);
    
    if (untilDate <= fromDate) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid until date must be after valid from date' 
      });
    }
    
    // Generate a random code if none provided
    let couponCode = code ? code.toUpperCase().trim() : generateRandomCode();
    
    // Check if code already exists
    const existingCoupon = await Coupon.findOne({ code: couponCode });
    if (existingCoupon) {
      // If provided code exists, generate a new one
      if (code) {
        return res.status(400).json({ 
          success: false,
          message: 'Coupon code already exists. Please use a different code.' 
        });
      } else {
        // Generate a new random code
        couponCode = generateRandomCode();
      }
    }

    const coupon = new Coupon({
      code: couponCode,
      discountPercentage: Number(discountPercentage),
      validFrom: fromDate,
      validUntil: untilDate,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      usedCount: 0
    });

    await coupon.save();
    res.status(201).json(coupon); // Return coupon directly for admin panel compatibility
  } catch (error) {
        console.error('Error creating coupon:', error);
        
        // Handle duplicate key error (MongoDB)
        if (error.code === 11000) {
          return res.status(400).json({ 
            success: false,
            message: 'Coupon code already exists' 
          });
        }
        
        res.status(500).json({ 
          success: false,
          message: error.message || 'Failed to create coupon',
          error: error.message 
        });
    }
};

// Delete a coupon (admin only)
export const deleteCoupon = async (req, res) => {
  try {
        const { id } = req.params;
        const coupon = await Coupon.findByIdAndDelete(id);
        
        if (!coupon) {
          return res.status(404).json({ 
            success: false,
            message: 'Coupon not found' 
          });
        }
        
        res.status(200).json({ 
          success: true,
          message: 'Coupon deleted successfully' 
        });
  } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({ 
          success: false,
          message: error.message || 'Failed to delete coupon',
          error: error.message 
        });
  }
};

// Validate a coupon code (public)
export const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }
    const normalizedCode = code.toUpperCase().trim();
    const coupon = await Coupon.findOne({ code: normalizedCode });

    if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
    }

        // Check if coupon is expired
    const now = new Date();
        if (now < new Date(coupon.validFrom) || now > new Date(coupon.validUntil)) {
            return res.status(400).json({ message: 'Coupon is not valid at this time' });
        }

        // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: 'Coupon usage limit reached' });
    }

    res.json({
      valid: true,
      discountPercentage: coupon.discountPercentage,
      code: coupon.code
    });
  } catch (error) {
        console.error('Error validating coupon:', error);
        res.status(500).json({ message: 'Failed to validate coupon' });
    }
};

// Helper function to generate random coupon code
function generateRandomCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}