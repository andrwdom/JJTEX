"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Share2, Truck, ShieldCheck, RotateCcw, ChevronRight } from "lucide-react"
import Image from "next/image"
import Script from "next/script"
import PageLoading from "@/components/page-loading"
import { useCart } from "@/components/cart-context";
import { useBuyNow } from "@/components/buy-now-context";
import { useCheckoutFlow } from "@/components/checkout-flow-manager";
import WishlistButton from "@/components/WishlistButton"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { getDesignerNote, getRomanticizedProductTitle } from "@/lib/product-page-copy"

interface Product {
  id?: number
  _id?: string
  customId?: string
  name: string
  price: number
  originalPrice: number
  images: string[]
  category: string
  description: string
  sizes: { size: string; stock: number }[]
  features: string[]
  rating: number
  reviews: number
  stock: number
  availableSizes?: string[]
  categorySlug?: string;
}

interface ProductPageClientProps {
  productId: string
}

export default function ProductPageClient({ productId }: ProductPageClientProps) {
  const [product, setProduct] = useState<Product | null>(null)

  // WhatsApp-style formatting function
  const formatWhatsAppStyle = (text: string) => {
    if (!text) return text;
    
    // More robust regex patterns that handle edge cases
    const boldPattern = /\*([^*]+)\*/g;
    const underlinePattern = /_([^_]+)_/g;
    const italicPattern = /\/([^/]+)\//g;
    
    let formattedText = text;
    
    // Apply bold formatting
    formattedText = formattedText.replace(boldPattern, '<strong class="font-bold text-gray-900">$1</strong>');
    
    // Apply underline formatting
    formattedText = formattedText.replace(underlinePattern, '<span class="underline">$1</span>');
    
    // Apply italic formatting
    formattedText = formattedText.replace(italicPattern, '<em class="italic">$1</em>');
    
    // Return as JSX with dangerouslySetInnerHTML for proper HTML rendering
    return <span dangerouslySetInnerHTML={{ __html: formattedText }} />;
  };
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [shakeSizes, setShakeSizes] = useState(false)
  const { addToCart, openCartSidebar, clearCart } = useCart()
  const { setBuyNowItem } = useBuyNow()
  const { setCheckoutFlow } = useCheckoutFlow();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Prefer same-origin /api in the browser (Next dev rewrites proxy to backend; prod is served behind nginx).
        // Only use NEXT_PUBLIC_API_URL if you explicitly deploy backend on a different origin.
        const timestamp = Date.now();
        const random = Math.random();
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const origin = baseUrl ? baseUrl.replace(/\/$/, "") : "";
        const apiUrl = `${origin}/api/products/${productId}?_t=${timestamp}&_r=${random}&_fresh=true&_cache_bust=${refreshKey}`;
        console.log('🔄 Fetching product from:', apiUrl);
        console.log('🔄 Refresh key:', refreshKey);
        
        const res = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'If-None-Match': '*'
          }
        });
        
        if (!res.ok) {
          // If backend is reachable but the id lookup fails, still treat as "not found"
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        
        console.log('📦 Product API response:', data);
        
        if (data.product) {
          console.log('📏 Product sizes from API:', data.product.sizes);
          console.log('📏 AvailableSizes from API:', data.product.availableSizes);
          console.log('📏 Product name:', data.product.name);
          console.log('📏 Product customId:', data.product.customId);
          
          // 🔧 FIX: Ensure sizes array is properly formatted
          if (data.product.sizes && Array.isArray(data.product.sizes)) {
            console.log('✅ Sizes array is valid:', data.product.sizes.length, 'items');
            data.product.sizes.forEach((size, index) => {
              console.log(`  - Size ${index + 1}:`, size);
            });
            
            // 🔧 FIX: Validate each size object
            const validSizes = data.product.sizes.filter(size => size && size.size);
            console.log('✅ Valid sizes after filtering:', validSizes.length);
            if (validSizes.length !== data.product.sizes.length) {
              console.log('⚠️ Some sizes were invalid and filtered out');
            }
          } else {
            console.log('❌ Sizes array is invalid:', data.product.sizes);
          }
          
          setProduct(data.product);
        } else if (data.success && data.data) {
          console.log('📏 Product sizes from API (data):', data.data.sizes);
          setProduct(data.data);
        } else {
          setError(data.message || data.error || 'Failed to fetch product');
        }
      } catch (error) {
        console.error('❌ Error fetching product:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, refreshKey])

  // Per-size stock logic - FIXED: Use same logic as SizeSelectionSidebar
  const sizeOptions = Array.isArray(product?.sizes) && product.sizes.length > 0
    ? product.sizes.map(s => s.size)
    : [];
  
  // 🔧 DEBUG: Log size processing
  console.log('🔍 PRODUCT PAGE DEBUG:');
  console.log('Product data:', product);
  console.log('Sizes array:', product?.sizes);
  console.log('Size options calculated:', sizeOptions);
  console.log('Size options length:', sizeOptions.length);
  
  const selectedSizeObj = product?.sizes?.find(s => s.size === selectedSize);
  const selectedSizeStock = selectedSizeObj ? Math.max(0, (selectedSizeObj.stock || 0) - (selectedSizeObj.reserved || 0)) : 0;
  const totalStockLeft = Array.isArray(product?.sizes)
    ? product!.sizes.reduce((sum: number, s: any) => sum + Math.max(0, (s?.stock || 0) - (s?.reserved || 0)), 0)
    : (product?.stock || 0);
  const showLowStock = selectedSize ? (selectedSizeStock > 0 && selectedSizeStock <= 3) : (totalStockLeft > 0 && totalStockLeft <= 3)
  const displayTitle = product ? getRomanticizedProductTitle(product) : ""
  const designerNote = product ? getDesignerNote(product) : ""

  // Auto-adjust quantity if it exceeds stock when size changes
  useEffect(() => {
    if (selectedSize && selectedSizeStock > 0 && quantity > selectedSizeStock) {
      setQuantity(selectedSizeStock)
    }
  }, [selectedSize, selectedSizeStock, quantity])

  const handleBuyNow = async () => {
    if (!selectedSize) {
      setShakeSizes(true)
      setTimeout(() => setShakeSizes(false), 300)
      return
    }
    if (!product) return;
    
    // Set buy now item with fresh data - use _id as primary ID since that's what backend returns
    const buyNowItem = {
      id: (product._id || product.id || productId)?.toString() || productId,
      _id: (product._id || product.id || productId)?.toString() || productId,
      name: product.name,
      price: product.price,
      quantity,
      size: selectedSize,
      image: product.images[0] || "/placeholder.svg",
      categorySlug: product.categorySlug,
      category: product.category
    };
    
    console.log('🛒 Setting buy-now item:', buyNowItem);
    
    // Set buy now item in context
    setBuyNowItem(buyNowItem);
    
    // Also manually save to storage to ensure persistence
    const buyNowData = {
      flow: {
        mode: 'buy-now',
        items: [buyNowItem],
        source: 'buy-now',
        timestamp: Date.now(),
        sessionId: `buynow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      },
      items: [buyNowItem],
      timestamp: Date.now()
    };
    
    // Save to multiple storage locations for maximum persistence
    sessionStorage.setItem('buyNowItem', JSON.stringify(buyNowItem));
    localStorage.setItem('buyNowItem', JSON.stringify(buyNowItem));
    sessionStorage.setItem('buyNowCheckoutData', JSON.stringify(buyNowData));
    localStorage.setItem('buyNowCheckoutData', JSON.stringify(buyNowData));
    
    console.log('💾 Buy-now item saved to storage before navigation');
    
    // Navigate to checkout using the checkout flow manager
    setCheckoutFlow('buy-now');
    
    // Small delay to ensure storage is written before navigation
    setTimeout(() => {
      console.log('🚀 Navigating to buy-now checkout');
      window.location.href = '/checkout?mode=buynow';
    }, 100);
  }

  // Safety check - ensure product exists before rendering
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#473C66] mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading product details...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f9f9f9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          {error && <p className="text-sm text-gray-600 mb-4">{error}</p>}
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="rounded-full bg-[#E91E63] hover:bg-[#d81b60]"
            >
              Retry
            </Button>
          <Button onClick={() => (window.location.href = "/")} className="rounded-full">
            Return to Home
          </Button>
          </div>
        </div>
      </div>
    )
  }

  // Additional safety check - ensure all required fields exist
  if (!product.name || !product.price || !product.images || !product.sizes) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Product Data</h1>
          <p className="text-gray-600 mb-4">This product appears to have incomplete information.</p>
          <Button onClick={() => (window.location.href = "/")} className="rounded-full">
            Return to Home
          </Button>
        </div>
      </div>
    )
  }

  let stockStatus = '';
  if (!selectedSize) stockStatus = '';
  else if (selectedSizeStock > 5) stockStatus = 'In Stock';
  else if (selectedSizeStock > 0) stockStatus = `Only ${selectedSizeStock} left!`;
  else stockStatus = 'Out of Stock';

  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="sticky top-20 z-40 bg-gradient-to-b from-[#fce4ec] via-[#fce4ec]/70 to-white/90 backdrop-blur-md border-b border-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col h-auto py-3">
              {/* Breadcrumb */}
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <Button variant="link" size="sm" className="p-0 h-auto text-[#E91E63] hover:text-[#d81b60]" onClick={() => (window.location.href = "/")}>
                  Home
                </Button>
                <ChevronRight className="h-4 w-4" />
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 h-auto text-[#E91E63] hover:text-[#d81b60]" 
                  onClick={() => {
                    const slug =
                      product.categorySlug ||
                      (product.category || "product").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
                    window.location.href = `/collections/${slug}`;
                  }}
                >
                  {product.category}
                </Button>
                <ChevronRight className="h-4 w-4" />
                <span className="text-gray-900 font-medium truncate">{displayTitle || product.name}</span>
              </div>
              
              {/* Product Title and Share */}
              <div className="flex items-center">
                <Button variant="ghost" onClick={() => window.history.back()} className="mr-4">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back
                </Button>
                <h1 className="text-lg font-semibold text-gray-900 truncate flex-1">{displayTitle || product.name}</h1>
                <div className="flex items-center space-x-2">
                  <WishlistButton productId={product.id?.toString() || product._id || productId} size="sm" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-700"
                    onClick={async () => {
                      if (navigator.share) {
                        const shareData = {
                          title: (displayTitle || product.name) || 'Product',
                          text: product.description || 'Check out this product',
                          url: window.location.href
                        };
                        try {
                          await navigator.share(shareData);
                        } catch (err) {
                          console.log('Share cancelled');
                        }
                      } else if (navigator.clipboard) {
                        try {
                          await navigator.clipboard.writeText(window.location.href);
                          alert('Link copied!');
                        } catch (err) {
                          alert('Could not copy link');
                        }
                      } else {
                        alert('Share not supported');
                      }
                    }}
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-b from-[#fce4ec] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-10">
          {/* Add Product structured data */}
          {product && (
            <Script
              id="product-schema"
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Product",
                  "name": product.name,
                  "image": product.images.length > 0 ? product.images : "/placeholder.svg",
                  "description": product.description,
                  "sku": `JJTEXTILES-${productId}`,
                  "mpn": `JJTEXTILES-${productId}`,
                  "brand": {
                    "@type": "Brand",
                    "name": "JJTextiles"
                  },
                  "offers": {
                    "@type": "Offer",
                    "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.jjtextiles.com'}/product/${productId}`,
                    "priceCurrency": "INR",
                    "price": product.price,
                    "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                    "itemCondition": "https://schema.org/NewCondition",
                    "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                    "seller": {
                      "@type": "Organization",
                      "name": "JJTextiles"
                    }
                  },
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": product.rating,
                    "reviewCount": product.reviews
                  }
                })
              }}
            />
          )}
          
          {/* Add BreadcrumbList structured data */}
          {product && (
            <Script
              id="breadcrumb-schema"
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "BreadcrumbList",
                  "itemListElement": [
                    {
                      "@type": "ListItem",
                      "position": 1,
                      "name": "Home",
                      "item": process.env.NEXT_PUBLIC_SITE_URL || "https://www.jjtextiles.com"
                    },
                    {
                      "@type": "ListItem",
                      "position": 2,
                      "name": product.category || "Product",
                      "item": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.jjtextiles.com'}/collections/${(product.category || "product").toLowerCase().replace(/ /g, '-')}`
                    },
                    {
                      "@type": "ListItem",
                      "position": 3,
                      "name": product.name,
                      "item": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.jjtextiles.com'}/product/${productId}`
                    }
                  ]
                })
              }}
            />
          )}
          
          <div className="grid lg:grid-cols-2 gap-10">
            {/* Product Images */}
            <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
              <div className="relative aspect-[2/3] w-full max-w-md bg-white rounded-[8px] overflow-hidden shadow-sm ring-1 ring-black/5 mx-auto">
                <Image
                  src={product.images[selectedImage] || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
                <button
                  className="absolute top-3 right-3 bg-white/80 hover:bg-white text-gray-700 rounded-full p-2 shadow transition-all"
                  title="Expand image"
                  onClick={() => window.open(product.images[selectedImage] || '/placeholder.svg', '_blank')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2m8 0h2a2 2 0 012 2v2m0 8v2a2 2 0 01-2 2h-2m-8 0H6a2 2 0 01-2-2v-2" /></svg>
                </button>
                {product.originalPrice > product.price && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </div>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto mt-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-none w-16 aspect-[2/3] rounded-[8px] overflow-hidden border transition-all duration-300 ${
                        selectedImage === index ? "border-[#E91E63]" : "border-black/10 hover:border-pink-200"
                      }`}
                    >
                      <Image
                        src={image || "/placeholder.svg"}
                        alt={`${product.name} ${index + 1}`}
                        width={60}
                        height={90}
                        className="object-cover w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div className="bg-white/70 backdrop-blur-md border border-pink-100 rounded-2xl shadow-sm p-5 sm:p-6">
                <p className="text-xs text-gray-500 uppercase tracking-[0.22em] mb-2">{product.category}</p>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 font-serif tracking-[0.01em]">
                  {displayTitle || product.name}
                </h1>

                {/* Price (directly under title) */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl font-bold text-gray-900 font-sans">₹{product.price.toLocaleString()}</span>
                  {product.originalPrice > product.price && (
                    <span className="text-xl text-gray-500 line-through">₹{product.originalPrice.toLocaleString()}</span>
                  )}
                </div>

                {/* Scarcity only when low */}
                {showLowStock && (
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-pink-200 px-3 py-1 text-sm text-gray-700">
                      <span className="h-2 w-2 rounded-full bg-[#E91E63]" />
                      <span className="font-medium">Only</span>
                      <span className="font-semibold tabular-nums">{selectedSize ? selectedSizeStock : totalStockLeft}</span>
                      <span className="font-medium">left</span>
                    </span>
                  </div>
                )}

                {/* Designer note */}
                {designerNote && (
                  <div className="mb-5">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      <span className="font-semibold text-gray-900">Designer’s note:</span> {designerNote}
                    </p>
                  </div>
                )}


                {/* Promotional banners can be added here if needed */}

                {/* Custom Size, Quantity, and Action Section */}
                <div className="space-y-4">
                  {/* Size label and Sizing guide */}
                  <div className="flex items-center justify-between text-xs font-medium text-gray-700 mb-1">
                    <span>
                      SIZE:
                      <span className="ml-1 font-semibold text-gray-900">{selectedSize || "-"}</span>
                    </span>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-cyan-600 hover:underline hover:text-cyan-700 transition text-xs font-medium"
                      onClick={() => window.open('/sizing-guide', '_blank')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6 6M4 20h7a2 2 0 002-2v-7a2 2 0 00-2-2H4a2 2 0 00-2 2v7a2 2 0 002 2z" /></svg>
                      Sizing guide
                    </button>
                  </div>
                  {/* Size tiles */}
                  {sizeOptions.length > 0 ? (
                    <div className={["grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-8 mb-2", shakeSizes ? "animate-shake-soft" : ""].join(" ")}>
                      {sizeOptions.map((size) => {
                        const sizeObj = product.sizes?.find(s => s.size === size);
                        const sizeStock = sizeObj ? sizeObj.stock : 0;
                        const isOutOfStock = sizeStock === 0;
                        const isSelected = selectedSize === size;
                        
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedSize(size)}
                            disabled={isOutOfStock}
                            className={[
                              "relative h-11 rounded-full px-3 text-sm font-semibold transition-all duration-300 ease-in-out focus:outline-none border",
                              isSelected
                                ? "border-[#E91E63] bg-[#E91E63] text-white shadow-[0_0_0_3px_rgba(233,30,99,0.18)]"
                                : isOutOfStock
                                  ? "border-black/10 bg-white/60 text-gray-400 opacity-50 cursor-not-allowed"
                                  : "border-black/10 bg-white text-gray-800 hover:border-pink-200 hover:bg-pink-50",
                            ].join(" ")}
                            title={isOutOfStock ? "Out of Stock" : `Select size ${size}`}
                          >
                            {size}
                            {isOutOfStock && (
                              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <span className="h-px w-8 bg-gray-400 rotate-[-25deg]" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-red-500 font-medium mb-2">Size not available</div>
                  )}
                  
                  
                  {/* Size availability indicator */}
                  {sizeOptions.length > 0 && (
                    <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>In Stock</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Out of Stock</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Quantity and Add to Cart */}
                  <div className="flex gap-3 items-center mb-2">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="h-10 w-10 flex items-center justify-center text-lg font-semibold text-gray-700 disabled:text-gray-300 bg-transparent hover:bg-gray-50 rounded-full transition-all duration-300"
                      >
                        –
                      </button>
                      <span className="min-w-6 text-center text-base font-semibold text-gray-900 select-none tabular-nums">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => {
                          // Only allow increasing quantity if it doesn't exceed available stock
                          if (selectedSizeStock && quantity < selectedSizeStock) {
                            setQuantity(quantity + 1)
                          }
                        }}
                        disabled={!selectedSize || !selectedSizeStock || quantity >= selectedSizeStock}
                        className="h-10 w-10 flex items-center justify-center text-lg font-semibold text-gray-700 bg-transparent hover:bg-gray-50 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                    <span className={`text-sm font-semibold ${selectedSize && selectedSizeStock === 0 ? 'text-red-500' : selectedSizeStock <= 5 && selectedSizeStock > 0 ? 'text-yellow-600' : 'text-green-600'}`}>{stockStatus}</span>
                    
                    {/* Stock warning if quantity exceeds available stock */}
                    {selectedSize && selectedSizeStock > 0 && quantity > selectedSizeStock && (
                      <div className="text-xs text-red-500 font-medium">
                        Maximum quantity: {selectedSizeStock}
                      </div>
                    )}
                    
                    <button
                      type="button"
                      className={`flex-1 border rounded-full h-11 font-semibold transition-all duration-300 ease-in-out text-sm disabled:opacity-50 disabled:cursor-not-allowed
                        ${!selectedSize 
                          ? "border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100" 
                          : selectedSizeStock === 0 
                            ? "border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
                            : "border-pink-200 bg-white text-gray-900 hover:bg-pink-50"
                        }
                      `}
                      disabled={!selectedSize || selectedSizeStock === 0 || quantity > selectedSizeStock}
                      onClick={() => {
                        if (!selectedSize) {
                          setShakeSizes(true)
                          setTimeout(() => setShakeSizes(false), 300)
                          return;
                        }
                        if (!product) return;
                        addToCart({
                          id: product.id?.toString() || product._id || productId,
                          _id: product.id?.toString() || product._id || productId,
                          name: product.name,
                          price: product.price,
                          quantity,
                          size: selectedSize,
                          image: product.images[0] || "/placeholder.svg",
                          category: product.category,
                        }, true);
                      }}
                    >
                      {!selectedSize ? "SELECT SIZE FIRST" : "ADD TO CART"}
                    </button>
                  </div>
                  {/* Buy it now */}
                  <button
                    type="button"
                    className={[
                      "w-full h-12 rounded-full text-white font-bold text-base tracking-wide transition-all duration-300 ease-in-out shadow-md",
                      "bg-gradient-to-r from-[#E91E63] to-[#ff5fa2] hover:shadow-lg hover:-translate-y-0.5",
                      !selectedSize ? "opacity-50" : "opacity-100",
                      (selectedSizeStock === 0 || quantity > selectedSizeStock) ? "opacity-50 cursor-not-allowed" : "",
                    ].join(" ")}
                    disabled={selectedSizeStock === 0 || quantity > selectedSizeStock}
                    onClick={() => {
                      if (!selectedSize) {
                        setShakeSizes(true)
                        setTimeout(() => setShakeSizes(false), 300)
                        return
                      }
                      handleBuyNow()
                    }}
                  >
                    BUY IT NOW
                  </button>
                </div>

                {/* Trust row (thin pink icons) */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-3 rounded-2xl border border-pink-100 bg-white/60 backdrop-blur px-4 py-3">
                    <Truck className="h-5 w-5 text-[#E91E63]" strokeWidth={1.25} />
                    <span className="text-sm text-gray-800">Delivery in 3–5 days</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-pink-100 bg-white/60 backdrop-blur px-4 py-3">
                    <ShieldCheck className="h-5 w-5 text-[#E91E63]" strokeWidth={1.25} />
                    <span className="text-sm text-gray-800">Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-pink-100 bg-white/60 backdrop-blur px-4 py-3">
                    <RotateCcw className="h-5 w-5 text-[#E91E63]" strokeWidth={1.25} />
                    <span className="text-sm text-gray-800">
                      <a href="/return-policy" className="underline underline-offset-4 hover:text-[#E91E63] transition-colors duration-300">
                        Refund policy
                      </a>
                    </span>
                  </div>
                </div>

                {/* Minimal accordions */}
                <div className="mt-6 rounded-2xl border border-pink-100 bg-white/70 backdrop-blur-md">
                  <Accordion type="single" collapsible>
                    <AccordionItem value="desc" className="px-5">
                      <AccordionTrigger className="text-gray-900 hover:no-underline">
                        Product description
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-700">
                        <div className="leading-relaxed space-y-2">
                          {product.description.split('\n').map((line, index) => {
                            if (line.trim() === '') return <div key={index} className="h-0.5"></div>;
                            if (line.trim().startsWith('*') && !line.trim().startsWith('**')) {
                              return (
                                <div key={index} className="flex items-start">
                                  <span className="text-[#E91E63] mr-2 mt-1 font-bold">•</span>
                                  <span>{formatWhatsAppStyle(line.trim().substring(1).trim())}</span>
                                </div>
                              );
                            }
                            if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
                              return (
                                <div key={index} className="font-semibold text-gray-900 pt-2">
                                  {line.trim().substring(2, line.trim().length - 2)}
                                </div>
                              );
                            }
                            return <p key={index}>{formatWhatsAppStyle(line.trim())}</p>;
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="care" className="px-5">
                      <AccordionTrigger className="text-gray-900 hover:no-underline">
                        Care instructions
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-700">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Gentle wash recommended; wash dark colors separately.</li>
                          <li>Do not bleach; dry in shade to preserve color.</li>
                          <li>Steam or low-heat iron as needed.</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="ship" className="px-5 border-b-0">
                      <AccordionTrigger className="text-gray-900 hover:no-underline">
                        Shipping details
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-700">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Dispatch in 24–48 hours (business days).</li>
                          <li>Delivery typically within 3–5 days depending on location.</li>
                          <li>For returns/refunds, please refer to our policy.</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  )
}