"use client"

import { useState, useEffect } from "react"
import Footer from "@/components/footer"
import CartSidebar from "@/components/cart-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronRight, Home, Search, Filter, SlidersHorizontal, Baby, Heart, Shirt, X, ShoppingBag } from "lucide-react"
import Image from "next/image"
import PageLoading from "@/components/page-loading"
import SizeSelectionSidebar from "@/components/size-selection-sidebar"
import CheckoutPromptModal from "@/components/checkout-prompt-modal"
import ErrorBoundary from "@/components/error-boundary"
import { safeFetch } from "@/lib/api-health"
import { useBuyNow } from "@/components/buy-now-context";
import { useCart } from "@/components/cart-context";
import { useCheckoutFlow } from "@/components/checkout-flow-manager";
import { useRouter, useSearchParams } from "next/navigation"
import WishlistButton from "@/components/WishlistButton"

interface Product {
  id: string // This will be the customId for routing
  _id: string // MongoDB ID for internal use
  customId: string // Custom product ID from admin
  name: string
  price: number
  originalPrice: number
  image: string
  images?: string[]
  category: string
  categorySlug?: string
  description: string
  sizes: any[] // Can be string[] or { size: string, stock: number }[]
  bestseller: boolean
  isBestSeller: boolean
  dateAdded?: string
}

interface CategoryPageClientProps {
  categorySlug: string
}

export default function CategoryPageClient({ categorySlug }: CategoryPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("featured")
  const [sizeSelectionProduct, setSizeSelectionProduct] = useState<Product | null>(null)
  const [isSizeSelectionOpen, setIsSizeSelectionOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string>("")
  const { setBuyNowItem } = useBuyNow()
  const { addToCart, openCartSidebar } = useCart()
  const { setCheckoutFlow } = useCheckoutFlow();

  // Available sizes for filtering (removed XS)
  const AVAILABLE_SIZES = ["S", "M", "L", "XL", "XXL", "3XL"]

  // Calculate available sizes with stock
  const getAvailableSizesWithStock = () => {
    const sizeCounts: { [key: string]: number } = {};
    
    // Initialize all sizes with 0 count
    AVAILABLE_SIZES.forEach(size => {
      sizeCounts[size] = 0;
    });
    
    // Count products available for each size
    products.forEach(product => {
      if (product.sizes && Array.isArray(product.sizes)) {
        product.sizes.forEach((sizeObj: any) => {
          if (typeof sizeObj === 'object' && sizeObj.size && sizeObj.stock > 0) {
            // New format: { size: "S", stock: 5 }
            if (sizeCounts.hasOwnProperty(sizeObj.size)) {
              sizeCounts[sizeObj.size]++;
            }
          } else if (typeof sizeObj === 'string') {
            // Legacy format: "S"
            if (sizeCounts.hasOwnProperty(sizeObj)) {
              sizeCounts[sizeObj]++;
            }
          }
        });
      }
    });
    
    // Return sizes with their counts
    return AVAILABLE_SIZES.filter(size => sizeCounts[size] > 0).map(size => ({
      size,
      count: sizeCounts[size]
    }));
  };

  const availableSizesWithStock = getAvailableSizesWithStock();

  // Initialize filters from URL params
  useEffect(() => {
    const sizeParam = searchParams.get('size')
    if (sizeParam) {
      setSelectedSize(sizeParam)
    }
  }, [searchParams])

  // Update URL when filters change
  const updateURL = (newSize?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (newSize) {
      params.set('size', newSize)
    } else {
      params.delete('size')
    }
    
    const newURL = `${window.location.pathname}?${params.toString()}`
    router.push(newURL, { scroll: false })
  }

  // Handle size filter selection
  const handleSizeFilter = (size: string) => {
    if (selectedSize === size) {
      // Deselect if already selected
      setSelectedSize("")
      updateURL("")
    } else {
      // Select new size
      setSelectedSize(size)
      updateURL(size)
    }
  }

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedSize("")
    setSearchQuery("")
    setSortBy("featured")
    updateURL("")
  }

  // Compute category name from slug
  const categoryName = categorySlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  // Sleeve filter availability is derived from the fetched products (no category hardcoding)

  useEffect(() => {
    async function getProducts() {
      setLoading(true);
      try {
        // Import the specialized fetch function
        const { fetchProducts: fetchProductsAPI } = await import('@/lib/api-utils')
        
        const params: Record<string, string> = {}
        if (categorySlug) {
          params.categorySlug = categorySlug
          params.sortBy = 'displayOrder'
          params.sortOrder = 'asc'
        }
        // Add size filter to API call if selected
        if (selectedSize) {
          params.size = selectedSize
        }

        const response = await fetchProductsAPI(params)

        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        // Handle multiple backend response shapes:
        // - { products: [...] }  (GET /api/products)
        // - { success: true, products: [...] } (admin list)
        // - { data: [...] } (some wrappers)
        const rawProducts = Array.isArray(data)
          ? data
          : (data?.products || data?.data?.products || data?.data || []);

        // Map backend fields to frontend
        const mappedProducts = (rawProducts || []).map((p: any) => ({
          id: String(p.customId || p._id), // Use customId for routing, fallback to _id
          _id: String(p._id),
          customId: String(p.customId || p._id),
          name: p.name,
          price: p.price,
          originalPrice: p.originalPrice,
          image: (Array.isArray(p.images) && p.images.length > 0) ? p.images[0] : '/placeholder.svg',
          images: Array.isArray(p.images) ? p.images : [p.image || '/placeholder.svg'],
          category: p.category,
          categorySlug: p.categorySlug || (typeof p.category === 'string' ? p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : undefined),
          description: p.description,
          sizes: p.sizes || [],
          bestseller: p.bestseller,
          isBestSeller: p.isBestSeller,
          dateAdded: p.createdAt,
        }));
        setProducts(mappedProducts);
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching products:', err);
        }
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    getProducts();
  }, [categorySlug, selectedSize]);

  // Filter and sort products
  useEffect(() => {
    let filtered = [...products]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Sort products
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price)
        break
      case "price-high":
        filtered.sort((a, b) => b.price - a.price)
        break
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        break
    }

    setFilteredProducts(filtered)
  }, [products, searchQuery, sortBy])

  const handleProductClick = async (productId: string, productCategorySlug?: string) => {
    // Use new URL structure: /[category-name]/product/[product-id]
    const { getProductUrl } = await import('@/lib/product-url-utils')
    const url = getProductUrl(productId, productCategorySlug || categorySlug)
    window.location.href = url
  }

  const handleCategorySelect = (slug: string) => {
    window.location.href = `/collections/${slug}`
  }

  const handleAddToCart = (product: Product) => {
    // Ensure images array is unique and not duplicating the main image
    let images: string[] = [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      images = Array.from(new Set(product.images.filter(Boolean)));
    } else if (product.image) {
      images = [product.image];
    }
    setSizeSelectionProduct({
      ...product,
      images,
    });
    setIsSizeSelectionOpen(true);
  }

  const handleSizeSelectionAddToCart = (product: any, size: string, quantity: number) => {
    addToCart({
      id: product.customId || product._id, // Use customId for routing
      _id: product._id, // Keep MongoDB ID for internal operations
      name: product.name,
      price: product.price,
      quantity,
      size,
      image: product.image,
      category: product.category,
      categorySlug: product.categorySlug,
    });
    // Remove popup and just open cart sidebar
    openCartSidebar();
  };

  const handleSizeSelectionBuyNow = (product: any, size: string, quantity: number) => {
    const buyNowItem = {
      id: product.customId || product._id, // Use customId for routing  
      _id: product._id, // Keep MongoDB ID for internal operations
      name: product.name,
      price: product.price,
      quantity,
      size,
      image: product.image,
      categorySlug: product.categorySlug,
      category: product.category
    };
    
    console.log('🛒 Setting buy-now item from category:', buyNowItem);
    
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
      console.log('🚀 Navigating to buy-now checkout from category');
      router.push('/checkout?mode=buynow');
    }, 100);
  };

  const handleCheckout = () => {
    setCheckoutFlow('cart');
  }

  // Check if any filters are active
  const hasActiveFilters = selectedSize || searchQuery

  return (
    <ErrorBoundary>
      <PageLoading loadingMessage="Loading JJTextiles Collection..." minLoadingTime={1500}>
        <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
        <div className="flex w-full overflow-x-hidden">
          {/* Category Sidebar - Refined Design with Proper Bounds */}
          <div className="w-80 flex-shrink-0 hidden lg:block">
            <div className="sticky top-32 h-[calc(100vh-8rem)] overflow-y-auto">
              <div className="bg-white shadow-xl rounded-3xl p-6 mx-4 border border-gray-100">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-[rgb(71,60,102)] font-serif bg-gradient-to-r from-[rgb(71,60,102)] to-purple-600 bg-clip-text text-transparent">Categories</h2>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-700">
                    Browse categories using the main navigation.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 lg:ml-0 w-full">
            {/* Breadcrumb */}
            <div className="px-4 sm:px-6 lg:px-8 py-6 w-full">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Button variant="ghost" size="sm" className="text-[rgb(71,60,102)] hover:text-[rgb(71,60,102)]/80" onClick={() => (window.location.href = "/")}>
                  <Home className="h-4 w-4 mr-1" />
                  Home
                </Button>
                <ChevronRight className="h-4 w-4" />
                <span className="text-gray-900 font-medium">{categoryName}</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-center font-semibold mb-4">
                {error}
              </div>
            )}

            {/* Page Header with Search and Filters */}
            <div className="px-4 sm:px-6 lg:px-8 pb-6 lg:pb-8 w-full">
              <div className="mb-6 lg:mb-8">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 lg:mb-4 font-serif">
                  {categoryName}
                </h1>
                <p className="text-base lg:text-lg text-gray-600 max-w-3xl">
                  Discover our carefully curated collection—quality you can feel, styles you’ll love.
                </p>
              </div>
              {/* Mobile category navigation is handled via main navigation */}

              {/* Search and Filter Bar */}
              <div className="flex flex-col gap-2 mb-6 lg:mb-8 w-full max-w-full px-0 sm:px-0">
                {/* Search Bar Row with Sort */}
                <div className="flex w-full gap-2 flex-row">
                  <div className="relative flex-1 min-w-0 max-w-full flex items-center">
                    <div className="flex items-center w-full">
                      <span className="inline-flex items-center px-3 h-12 border border-r-0 border-gray-200 bg-white rounded-l-full text-gray-400 text-base">
                        <Search className="h-5 w-5" />
                      </span>
                      <Input
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-12 border border-gray-200 border-l-0 rounded-l-none rounded-r-lg focus:border-[rgb(71,60,102)] bg-white text-base w-full max-w-[calc(100vw-4.5rem)] sm:w-[350px] lg:w-[450px] transition-all duration-200 pr-2"
                        style={{ boxShadow: 'none' }}
                      />
                    </div>
                  </div>

                  {/* Sort Dropdown: Icon only on mobile, full on sm+ */}
                  <div className="flex-shrink-0">
                    {/* Mobile Select */}
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="h-12 w-12 border-2 border-gray-200 focus:border-[rgb(71,60,102)] rounded-lg flex items-center justify-center sm:hidden">
                        <SlidersHorizontal className="h-6 w-6" />
                      </SelectTrigger>
                      <SelectContent 
                        position="popper" 
                        side="bottom" 
                        align="end" 
                        className="w-48 z-[9999]"
                        sideOffset={4}
                        alignOffset={0}
                        avoidCollisions={false}
                        collisionBoundary={undefined}
                        sticky="always"
                        onCloseAutoFocus={(e: any) => e.preventDefault()}
                      >
                        <SelectItem value="featured">Featured</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="name">Name: A to Z</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {/* Desktop Select */}
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="hidden sm:flex w-40 h-12 border-2 border-gray-200 focus:border-[rgb(71,60,102)] rounded-lg items-center">
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent 
                        position="popper" 
                        side="bottom" 
                        align="end" 
                        className="w-[var(--radix-select-trigger-width)] z-[9999]"
                        sideOffset={4}
                        alignOffset={0}
                        avoidCollisions={false}
                        collisionBoundary={undefined}
                        sticky="always"
                        onCloseAutoFocus={(e: any) => e.preventDefault()}
                      >
                        <SelectItem value="featured">Featured</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="name">Name: A to Z</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

              </div>

              {/* Filter and Sort Section */}
              <div className="mb-6 w-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-sm text-gray-600">
                    {filteredProducts.length} of {products.length} products
                  </div>
                </div>

                {/* Applied Filters */}
                {selectedSize && (
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm">
                      <span className="text-gray-700">Size: {selectedSize}</span>
                      <button
                        onClick={() => handleSizeFilter(selectedSize)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                      >
                        Remove all
                      </button>
                    )}
                  </div>
                )}

                {/* Size Filter Buttons */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Filter by Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableSizesWithStock.map((sizeWithCount) => (
                      <button
                        key={sizeWithCount.size}
                        onClick={() => handleSizeFilter(sizeWithCount.size)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                          selectedSize === sizeWithCount.size
                            ? 'bg-black text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {sizeWithCount.size} ({sizeWithCount.count})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid - Responsive: 2 columns on mobile, 4 on desktop */}
            {/* Products Grid - Clean Minimalist Layout */}
            <div className="px-2 sm:px-4 lg:px-8 pb-16 w-full box-border">
              {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 aspect-square rounded-lg mb-4" />
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                        <div className="h-10 bg-gray-200 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="group cursor-pointer"
                      onClick={() => handleProductClick(product.id, product.categorySlug || categorySlug)}
                    >
                      {/* Clean Product Image */}
                      <div className="relative aspect-[2/3] bg-gray-100 rounded-lg overflow-hidden mb-4">
                        <Image
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          loading="lazy"
                          className="object-cover group-hover:scale-105 transition-transform duration-300 rounded-lg"
                        />
                        
                        {/* Always visible wishlist button */}
                        <div className="absolute top-3 right-3 z-10">
                          <WishlistButton productId={product._id} size="sm" />
                        </div>
                        
                        {/* Overlay buttons on hover */}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                          <Button 
                            size="sm" 
                            className="rounded-full bg-pink-500 hover:bg-pink-600 shadow-lg"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAddToCart(product)
                            }}
                          >
                            <ShoppingBag className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Clean Product Info */}
                      <div className="space-y-3">
                        {/* Product Title */}
                        <h3 className="text-sm lg:text-base font-medium text-gray-900 leading-tight">{product.name}</h3>

                        {/* Price */}
                        <div className="text-sm lg:text-base text-gray-900">
                          ₹ {product.price.toLocaleString()}.00 INR
                        </div>


                        {/* Simple Add to Cart Button */}
                        <Button
                          variant="outline"
                          className="w-full border border-brand text-brand hover:bg-brand hover:text-white bg-white rounded-none font-normal text-sm py-2 h-auto transition-colors duration-200 focus:ring-2 focus:ring-brand"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAddToCart(product)
                          }}
                        >
                          ADD TO CART
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
                  <Button
                    onClick={clearAllFilters}
                    variant="outline"
                    className="border border-brand text-brand hover:bg-brand hover:text-white bg-white rounded-none px-6 focus:ring-2 focus:ring-brand"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <CartSidebar />

        <SizeSelectionSidebar
          isOpen={isSizeSelectionOpen}
          onClose={() => setIsSizeSelectionOpen(false)}
          product={sizeSelectionProduct as any}
          onAddToCart={handleSizeSelectionAddToCart}
          onBuyNow={handleSizeSelectionBuyNow}
        />

        </div>
      </PageLoading>
    </ErrorBoundary>
  )
}
