import { CartItem } from "@/components/cart-context"

export interface ShippingInfo {
  state: string
  city?: string
  pincode?: string
}

export interface ShippingCalculation {
  shippingCost: number
  isFreeShipping: boolean
  shippingMessage: string
}

/**
 * Calculate shipping cost based on cart items and shipping location
 *
 * NOTE: Maternity-specific logic has been removed.
 * Fallback shipping rule:
 * - Tamil Nadu / Puducherry: Free shipping
 * - Other states: 1→₹39, 2→₹59, 3→₹89, 4+→₹105
 */
export function calculateShippingCost(
  cartItems: CartItem[],
  shippingInfo: ShippingInfo | null
): ShippingCalculation {
  if (!cartItems || cartItems.length === 0) {
    return {
      shippingCost: 0,
      isFreeShipping: false,
      shippingMessage: "No items in cart"
    }
  }

  // Check if shipping info is available
  if (!shippingInfo || !shippingInfo.state) {
    return {
      shippingCost: 0,
      isFreeShipping: false,
      shippingMessage: "Shipping location not set"
    }
  }

  const normalizedState = (shippingInfo.state || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ''); // Remove all whitespace

  const isTamilNadu = ['tamilnadu', 'tamilnaadu', 'tamil', 'puducherry', 'pondicherry', 'pondichery', 'pudhucherry'].includes(normalizedState);

  const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  let shippingCost = 0;
  if (!isTamilNadu) {
    if (totalItems === 1) shippingCost = 39;
    else if (totalItems === 2) shippingCost = 59;
    else if (totalItems === 3) shippingCost = 89;
    else if (totalItems >= 4) shippingCost = 105;
  }

  const isFreeShipping = shippingCost === 0;
  const shippingMessage = isFreeShipping
    ? `Free shipping for ${totalItems} item${totalItems > 1 ? 's' : ''}!`
    : `₹${shippingCost} shipping for ${totalItems} item${totalItems > 1 ? 's' : ''}`;
  
  return {
    shippingCost,
    isFreeShipping,
    shippingMessage
  }
}

/**
 * Get shipping message for display in cart and checkout
 */
export function getShippingDisplayMessage(
  cartItems: CartItem[],
  shippingInfo: ShippingInfo | null
): string {
  const calculation = calculateShippingCost(cartItems, shippingInfo)
  
  if (!shippingInfo || !shippingInfo.state) {
    return "Shipping calculated based on your location and items"
  }
  
  return "Shipping calculated based on your location and items"
} 