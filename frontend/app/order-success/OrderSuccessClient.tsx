"use client";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import { authenticatedFetch } from '@/lib/api-utils';

export default function OrderSuccessClient() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center min-h-[60vh]"><div className="loading loading-spinner loading-lg text-green-600"></div></div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}

function OrderSuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get("orderId");
  const transactionId = params.get("transactionId"); // 🔑 ADDED: Get transactionId from URL
  const paymentMethod = params.get("paymentMethod"); // Get payment method from URL
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [optimisticOrder, setOptimisticOrder] = useState<any>(null); // For instant UI

  useEffect(() => {
    // 🔑 FIX: Load order details from multiple storage locations for maximum reliability
    const storageKeys = [
      'pendingOrderData',
      'phonepeOrderData',
      'buyNowOrderData',
      'cartOrderData',
      'optimisticOrderDetails'
    ];
    
    // Try to find order data in any storage location
    for (const key of storageKeys) {
      const data = sessionStorage.getItem(key) || localStorage.getItem(key);
      if (data) {
        try {
          const details = JSON.parse(data);
          // Add payment status since we know the payment was successful
          const orderDetails = {
            ...details,
            paymentStatus: 'paid',
            status: 'Order Placed',
            orderStatus: 'Confirmed'
          };
          setOptimisticOrder(orderDetails);
          console.log('Found order details in storage:', key);
          // Clean up storage
          sessionStorage.removeItem(key);
          localStorage.removeItem(key);
          break;
      } catch (e) {
          console.error(`Failed to parse order details from ${key}:`, e);
        }
      }
    }

    // If no ID is provided, show error
    if (!orderId && !transactionId) {
      if (!optimisticOrder) { // Only error if we have no order data at all
        setError("No order or transaction ID provided. Please check your order confirmation email or contact support.");
        setLoading(false);
      }
      return;
    }

    const fetchOrderDetails = async () => {
      // Don't show main loader if we have optimistic data
      if (!optimisticOrder) {
        setLoading(true);
      }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      
      let endpoint = '';
      if (orderId) {
        endpoint = `${apiUrl}/api/orders/by-orderid/${orderId}`;
      } else if (transactionId) {
        endpoint = `${apiUrl}/api/payment/order/${transactionId}`;
      }

      // For COD orders, accept immediately - no need to retry
      const isCOD = paymentMethod === 'COD';
      const maxAttempts = isCOD ? 3 : 10; // Fewer retries for COD, more for payment gateway orders
      const retryDelay = isCOD ? 500 : 1000; // Faster retries for COD
      
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          console.log(`Fetching order details, attempt #${attempt}`);
          const orderRes = await authenticatedFetch(endpoint);
          const responseData = await orderRes.json();
          
          if (orderRes.ok && responseData.success) {
            const orderDetails = responseData.order || responseData.data;
            if (orderDetails) {
              // For COD orders, accept immediately regardless of payment status
              // For other orders, check for successful payment status
              const isCODOrder = orderDetails.paymentMethod === 'COD';
              const isPaid = isCODOrder || 
                           orderDetails.paymentStatus === 'PAID' || 
                           orderDetails.paymentStatus === 'paid' || 
                           orderDetails.status === 'CONFIRMED' || 
                           orderDetails.status === 'Paid' || 
                           orderDetails.status === 'Order Placed';
              
              if (isPaid || isCODOrder) {
                setOrder(orderDetails);
                setError(""); // Clear any previous errors
                setLoading(false);
                return; // Success! Exit the loop.
              }
              
              // For non-COD orders, only retry if status is still pending
              if (!isCODOrder && attempt < maxAttempts) {
                console.log(`Order status is '${orderDetails.paymentStatus}' / '${orderDetails.status}', retrying...`);
              } else {
                // Accept the order even if status is pending (for COD or after max retries)
                setOrder(orderDetails);
                setLoading(false);
                return;
              }
            } else {
              // If the API returns success but no data, that's a hard failure.
              setError("Order data not found for this transaction.");
              setLoading(false);
              return;
            }
          } else if (orderRes.status === 404) {
            // For COD orders, if not found after first attempt, show optimistic message
            if (isCOD && attempt === 1) {
              // COD order might not be indexed yet, show success message
              setLoading(false);
              return;
            }
            // A 404 is a definitive "not found", so we stop retrying.
            setError(responseData.message || 'Order not found. It may still be processing.');
            setLoading(false);
            return;
          }
          // For other non-ok responses, we'll just let it retry.
        } catch (error: any) {
          console.error(`Attempt ${attempt} failed:`, error.message);
          // For COD orders, if first attempt fails, show success anyway
          if (isCOD && attempt === 1) {
            setLoading(false);
            return;
          }
        }
        
        // Wait before the next attempt (shorter delay for COD)
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
      
      // If all retries fail, show a reassuring fallback message.
      if (isCOD) {
        // For COD, always show success even if we couldn't fetch
        setLoading(false);
      } else {
        setError("Your payment was successful and your order is being processed. You can view the final details on your account page shortly.");
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, transactionId, router]);

  if (loading && !optimisticOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-green-500 animate-spin mb-4" />
        <div className="text-lg font-semibold text-gray-700">Loading your order...</div>
      </div>
    );
  }

  // Use the confirmed order if available, otherwise use the optimistic one
  const displayOrder = order || optimisticOrder;

  if (error && !displayOrder) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <div className="text-4xl text-red-500 mb-4">❌</div>
        <h1 className="text-2xl font-bold mb-4">Order Confirmation Pending</h1>
        <p className="mb-6 text-gray-600">{error}</p>
        <a href="/" className="btn btn-primary">Back to Home</a>
      </div>
    );
  }

  if (!displayOrder) {
    // This state is hit if there's no optimistic data and the fetch is loading or has an error.
    // A more specific loading or error screen is shown above. This is a fallback.
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-gray-500 animate-spin mb-4" />
        <div className="text-lg font-semibold text-gray-700">Confirming order details...</div>
      </div>
    );
  }

  // For COD orders, consider them "placed" even if payment status is PENDING
  const isCOD = paymentMethod === 'COD' || displayOrder?.paymentMethod === 'COD';
  const isPaid = isCOD || displayOrder?.paymentStatus === 'PAID' || displayOrder?.paymentStatus === 'paid' || 
                displayOrder?.status === 'CONFIRMED' || displayOrder?.status === 'Paid' || 
                displayOrder?.status === 'Order Placed' || displayOrder?.orderStatus === 'CONFIRMED';
  const isFailed = !isCOD && (displayOrder?.paymentStatus === 'failed' || displayOrder?.paymentStatus === 'FAILED' ||
                  displayOrder?.status === 'Payment Failed' || displayOrder?.status === 'FAILED');

  // For COD orders, always show success
  const showSuccess = isCOD || isPaid;

  return (
    <div className="max-w-2xl mx-auto p-6 sm:p-10 text-center flex flex-col items-center justify-center min-h-[70vh] container-responsive">
      {/* Success/Failure Animation */}
      <div className="mb-6 animate-bounce-in">
        {showSuccess ? (
          <CheckCircle className="h-20 w-20 text-green-500 drop-shadow-lg" />
        ) : (
          <div className="text-6xl text-red-500">❌</div>
        )}
      </div>
      {isCOD ? (
        <>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-green-700">Order Placed Successfully!</h1>
          <p className="text-lg text-gray-700 mb-4">Thank you for shopping with JJTextiles! We've received your Cash on Delivery order request.</p>
        </>
      ) : (
        <>
          <h1 className={`text-3xl sm:text-4xl font-bold mb-2 ${showSuccess ? 'text-green-700' : 'text-red-700'}`}>{showSuccess ? 'Order Placed Successfully!' : 'Payment Failed'}</h1>
          <p className="text-lg text-gray-700 mb-4">{showSuccess ? 'Thank you for shopping with JJTextiles. Your order is confirmed.' : 'Your payment was not successful. Please try again.'}</p>
        </>
      )}
      <div className="bg-white rounded-xl shadow p-6 mb-6 w-full max-w-lg mx-auto flex flex-col gap-2">
        <div className="flex flex-wrap justify-between text-left text-gray-800">
          <div className="font-semibold">Order ID:</div>
          <div className="font-mono">{displayOrder.orderId}</div>
        </div>
        {displayOrder.phonepeTransactionId && (
          <div className="flex flex-wrap justify-between text-left text-gray-800">
            <div className="font-semibold">Transaction ID:</div>
            <div className="font-mono">{displayOrder.phonepeTransactionId}</div>
          </div>
        )}
        <div className="flex flex-wrap justify-between text-left text-gray-800">
          <div className="font-semibold">{isCOD ? 'Order Amount:' : 'Amount Paid:'}</div>
          <div>₹{displayOrder.amountPaid || displayOrder.total || displayOrder.totalPrice}</div>
        </div>
        <div className="flex flex-wrap justify-between text-left text-gray-800">
          <div className="font-semibold">Payment Method:</div>
          <div className="capitalize">{displayOrder.paymentMethod || (isCOD ? 'Cash on Delivery' : 'N/A')}</div>
        </div>
        <div className="flex flex-wrap justify-between text-left text-gray-800">
          <div className="font-semibold">Status:</div>
          <div className={`capitalize font-bold ${showSuccess ? 'text-green-700' : 'text-red-700'}`}>
            {isCOD ? 'Order Placed' : (displayOrder.paymentStatus || displayOrder.status || 'N/A')}
          </div>
        </div>
        {((displayOrder.items && displayOrder.items.length > 0) || (displayOrder.cartItems && displayOrder.cartItems.length > 0)) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="font-semibold text-left text-gray-800 mb-2">Order Items:</div>
            <div className="space-y-2">
              {(displayOrder.items || displayOrder.cartItems || []).map((item: any, index: number) => (
                <div key={index} className="flex justify-between text-sm text-gray-700">
                  <span>{item.name} {item.size ? `(Size: ${item.size})` : ''} x {item.quantity}</span>
                  <span>₹{(item.price || 0) * (item.quantity || 1)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {showSuccess ? (
        <>
          {isCOD ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 max-w-lg mx-auto">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base font-semibold text-green-900 mb-2">🎉 Your Order Has Been Placed Successfully!</p>
                  <p className="text-sm text-green-800 mb-3">
                    We've received your Cash on Delivery order request. Your order details have been saved and our team will process it shortly.
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <p className="text-sm font-semibold text-green-900 mb-2">📞 What Happens Next?</p>
                    <ol className="text-xs text-green-800 space-y-1 list-decimal list-inside">
                      <li>Our team will call or WhatsApp you to confirm your order</li>
                      <li>Once confirmed, we'll prepare and ship your order</li>
                      <li>You can pay cash when the order is delivered</li>
                    </ol>
                  </div>
                  <p className="text-xs text-green-700 mt-3">
                    <strong>Please keep your phone available</strong> - We'll contact you at the number provided during checkout.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="text-green-700 font-medium mb-2">Your invoice has been emailed to you.</div>
              <div className="text-gray-600 mb-6">You can also view your order in your account.</div>
            </>
          )}
          
          {/* Cart preservation message for buy now users */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-lg mx-auto">
            <div className="text-blue-800 text-sm">
              <p className="font-medium mb-2">🛒 Your cart items are still available!</p>
              <p className="text-blue-700">
                If you had other items in your cart, they're still there and ready for your next purchase.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              className="px-6 py-3 rounded-xl bg-green-100 text-green-800 font-semibold shadow hover:bg-green-200 transition"
              onClick={() => router.push('/account')}
            >
              Track Order
            </button>
            <button
              className="px-6 py-3 rounded-xl bg-blue-100 text-blue-800 font-semibold shadow hover:bg-blue-200 transition"
              onClick={() => {
                // Open cart sidebar if available, otherwise go to homepage
                if (typeof window !== 'undefined' && window.location.pathname.includes('order-success')) {
                  // Try to trigger cart sidebar open
                  const event = new CustomEvent('openCartSidebar');
                  window.dispatchEvent(event);
                  // Fallback to homepage if cart sidebar doesn't open
                  setTimeout(() => {
                    if (window.location.pathname.includes('order-success')) {
                      window.location.href = '/';
                    }
                  }, 100);
                } else {
                  window.location.href = '/';
                }
              }}
            >
              Continue Shopping
            </button>
            <a
              href="/"
              className="px-6 py-3 rounded-xl bg-gray-200 text-gray-800 font-semibold shadow hover:bg-gray-300 transition"
            >
              Back to Homepage
            </a>
          </div>
        </>
      ) : (
        <>
          <div className="text-red-600 font-medium mb-4">If money was deducted, it will be auto-refunded by your bank. You can retry payment below.</div>
          <button
            className="px-6 py-3 rounded-xl bg-red-100 text-red-800 font-semibold shadow hover:bg-red-200 transition"
            onClick={() => router.push('/checkout')}
          >
            Retry Payment
          </button>
        </>
      )}
      {/* Confetti animation (optional) */}
      <style>{`
        @keyframes bounce-in { 0% { transform: scale(0.7); opacity: 0; } 80% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); } }
        .animate-bounce-in { animation: bounce-in 0.7s cubic-bezier(.68,-0.55,.27,1.55) both; }
      `}</style>
    </div>
  );
} 