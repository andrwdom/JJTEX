"use client";
import React from 'react'


export default function OrderSummary({ 
  summary, 
  cartItems, 
  coupon, 
  offerDetails, 
  mode = 'cart', 
  shippingInfo,
  paymentMethod 
}: any) {
  // All calculations are now received via the 'summary' prop
  const { 
    subtotal, 
    offerDiscount, 
    couponDiscount, 
    shipping, 
    total, 
    shippingMessage, 
    isFreeShipping 
  } = summary;

  const isBuyNowMode = mode === 'buy-now';
  const displayItems = cartItems || [];

  console.log('[OrderSummary] ✅ Using pre-calculated summary prop:', {
    summary,
    mode,
    displayItemsCount: displayItems.length
  });
  
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border md:sticky md:top-20">
      <h3 className="text-lg font-semibold mb-4">
        Order Summary {isBuyNowMode && <span className="text-sm text-blue-600">(Buy Now)</span>}
      </h3>
      <div className="space-y-2 text-sm">
        {displayItems.map((item: any) => (
          <div key={item.id + item.size} className="flex justify-between">
            <span>{item.name} <span className="text-xs text-gray-500">({item.size})</span> x {item.quantity}</span>
            <span>₹{item.price * item.quantity}</span>
          </div>
        ))}
        <div className="border-t pt-2 flex justify-between">
          <span>Subtotal</span><span>₹{subtotal}</span>
        </div>
        
        {/* Category-specific offers removed */}
        
        {/* Coupon Discount */}
        {coupon && couponDiscount > 0 && (
          <div className="flex justify-between text-green-700 font-semibold">
            <span>Coupon Discount ({coupon.discountPercentage}%)</span>
            <span>-₹{couponDiscount}</span>
          </div>
        )}
        
        {/* 🔑 FIXED: Dynamic shipping display based on actual calculation */}
        <div className="flex justify-between items-center">
          <span>Shipping</span>
          <span className="flex flex-col items-end">
            {!shippingInfo?.state ? (
              <span className="text-gray-500 text-sm">Set shipping location</span>
            ) : isFreeShipping ? (
              <span className="text-green-700 font-semibold text-sm">{shippingMessage}</span>
            ) : (
              <span className="text-gray-700 font-semibold text-sm">₹{shipping}</span>
            )}
          </span>
        </div>
        
        {/* 🔑 FIXED: Show shipping message below the cost */}
        {shippingMessage && shippingInfo?.state && (
          <div className="text-xs text-gray-600 text-right">
            {shippingMessage}
          </div>
        )}
        
        <div className="border-t pt-2 font-semibold text-base flex justify-between">
          <span>Total</span><span>₹{total}</span>
        </div>
        
        {/* COD Confirmation Message */}
        {paymentMethod === 'cod' && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900 mb-1">Cash on Delivery Order</p>
                <p className="text-xs text-amber-700">
                  Your order will be confirmed once we receive a call or WhatsApp message confirmation from you. 
                  Please keep your phone available for our team to contact you.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Offer details removed */}
      </div>
    </div>
  )
} 