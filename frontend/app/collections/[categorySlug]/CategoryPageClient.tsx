"use client"

import { useState, useEffect } from "react"
import CartSidebar from "@/components/cart-sidebar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronRight, Search, Filter, SlidersHorizontal, X, ShoppingBag } from "lucide-react"
import Image from "next/image"
import PageLoading from "@/components/page-loading"
import SizeSelectionSidebar from "@/components/size-selection-sidebar"
import ErrorBoundary from "@/components/error-boundary"
import { useBuyNow } from "@/components/buy-now-context";
import { useCart } from "@/components/cart-context";
import { useCheckoutFlow } from "@/components/checkout-flow-manager";
import { useRouter, useSearchParams } from "next/navigation"
import WishlistButton from "@/components/WishlistButton"
import { getCategoryHeroCopy, getProductDisplayTitle, getProductFeatureSummary, humanizeCategorySlug } from "@/lib/category-page-copy"
import { decodeCategoryPathFromUrl, fetchCategoryByPath, fetchCategoryBySlug, isEncodedCategoryPath } from "@/lib/category-utils"

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
  categorySlug: string // Can be a legacy slug OR an encoded category path
}

export default function CategoryPageClient({ categorySlug }: CategoryPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState("featured")
  const [sizeSelectionProduct, setSizeSelectionProduct] = useState<Product | null>(null)
  const [isSizeSelectionOpen, setIsSizeSelectionOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string>("")
  const { setBuyNowItem } = useBuyNow()
  const { addToCart, openCartSidebar } = useCart()
  const { setCheckoutFlow } = useCheckoutFlow();
  const [resolvedCategory, setResolvedCategory] = useState<{
    name: string
    slug: string
    path?: string
    breadcrumbs?: Array<{ name: string; slug: string; path?: string }>
  } | null>(null)

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

  // Read search query from navbar (synced via `?q=` by SiteHeader in collections pages)
  const searchQuery = (searchParams.get('q') || "").trim()

  // Update URL when filters change
  const updateURL = (opts: { size?: string; q?: string } = {}) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (opts.size !== undefined) {
      if (opts.size) params.set('size', opts.size)
      else params.delete('size')
    }
    if (opts.q !== undefined) {
      if (opts.q) params.set('q', opts.q)
      else params.delete('q')
    }
    
    const qs = params.toString()
    const newURL = qs ? `${window.location.pathname}?${qs}` : `${window.location.pathname}`
    router.push(newURL, { scroll: false })
  }

  // Handle size filter selection
  const handleSizeFilter = (size: string) => {
    if (selectedSize === size) {
      // Deselect if already selected
      setSelectedSize("")
      updateURL({ size: "" })
    } else {
      // Select new size
      setSelectedSize(size)
      updateURL({ size })
    }
  }

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedSize("")
    setSortBy("featured")
    updateURL({ size: "", q: "" })
  }

  // Compute category name (prefer backend category name to avoid confusion/duplicates)
  const categoryName = resolvedCategory?.name || humanizeCategorySlug(categorySlug)

  // Sleeve filter availability is derived from the fetched products (no category hardcoding)

  useEffect(() => {
    async function getProducts() {
      setLoading(true);
      try {
        // Resolve category from backend (slug can be ambiguous; path is unique)
        let category: any = null
        let breadcrumbs: Array<{ name: string; slug: string; path?: string }> = []

        if (isEncodedCategoryPath(categorySlug)) {
          const path = decodeCategoryPathFromUrl(categorySlug)
          const data = await fetchCategoryByPath(path, true)
          category = data?.category || null
          breadcrumbs = (data?.breadcrumbs || []).map((b: any) => ({ name: b.name, slug: b.slug, path: b.path }))
        } else {
          category = await fetchCategoryBySlug(categorySlug, true)
          // Try to build breadcrumbs from `ancestors` if present on the category doc
          if (category?.ancestors && Array.isArray(category.ancestors)) {
            breadcrumbs = [
              ...category.ancestors.map((a: any) => ({ name: a.name, slug: a.slug, path: a.path })),
              { name: category.name, slug: category.slug, path: category.path }
            ]
          }
        }

        if (!category?.slug) {
          throw new Error('Category could not be resolved')
        }

        setResolvedCategory({
          name: category.name || humanizeCategorySlug(categorySlug),
          slug: category.slug,
          path: category.path,
          breadcrumbs
        })

        // Fetch products via category endpoint (supports non-leaf categories + descendants)
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          (process.env.NODE_ENV === 'production'
            ? (process.env.NEXT_PUBLIC_SITE_URL ||
                (typeof window !== 'undefined' ? window.location.origin : 'https://jjtextiles.com'))
            : 'http://localhost:4000')

        const url = new URL(`${baseUrl}/api/categories/${category.slug}/products`)
        url.searchParams.set('limit', '1000')
        url.searchParams.set('sortBy', 'displayOrder')
        url.searchParams.set('sortOrder', 'asc')
        if (selectedSize) url.searchParams.set('size', selectedSize)

        const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } })

        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        // Handle backend response shape from paginatedResponse: { data: [...] }
        const rawProducts = Array.isArray(data) ? data : (data?.data || data?.products || []);

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
          categorySlug: p.categorySlug || category.slug,
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
    const effectiveSlug = productCategorySlug || resolvedCategory?.slug || categorySlug
    const url = getProductUrl(productId, effectiveSlug)
    window.location.href = url
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

  // Check if any filters are active
  const hasActiveFilters = selectedSize || searchQuery
  const heroCopy = getCategoryHeroCopy(categorySlug, products)

  return (
    <ErrorBoundary>
      <PageLoading loadingMessage="Loading JJTextiles Collection..." minLoadingTime={1500}>
        <div className="min-h-screen bg-[#f9f9f9] w-full overflow-x-hidden">
        <div className="flex w-full overflow-x-hidden">

          {/* Main Content */}
          <div className="flex-1 w-full">
            {/* Premium Category Hero (homepage-header inspired) */}
            <section className="w-full">
              <div className="bg-gradient-to-b from-[#fce4ec] via-[#fce4ec] to-white">
                <div className="px-4 sm:px-6 lg:px-8 pt-3 pb-6 sm:pt-4 sm:pb-8">
                  <div className="mx-auto max-w-6xl">
                    <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500/90">
                      <button
                        type="button"
                        onClick={() => (window.location.href = "/")}
                        className="hover:text-gray-800 transition-colors"
                      >
                        Home
                      </button>
                      <ChevronRight className="h-4 w-4 opacity-70" />
                      <span className="text-gray-700 font-medium">{categoryName}</span>
                    </div>

                    <div className="mt-2 text-center">
                      {heroCopy.eyebrow && (
                        <p className="text-[11px] sm:text-[12px] tracking-[0.18em] uppercase text-pink-700/80">
                          {heroCopy.eyebrow}
                        </p>
                      )}
                      <h1 className="mt-2 text-[26px] sm:text-[34px] lg:text-[40px] font-extrabold tracking-[0.02em] text-[#1f1f1f] font-serif">
                        {heroCopy.title}
                      </h1>
                      <p className="mt-3 text-[13px] sm:text-[14px] lg:text-[15px] text-gray-700 max-w-2xl mx-auto leading-relaxed">
                        {heroCopy.description}
                      </p>

                      <div className="mt-3 flex items-center justify-center gap-3 text-[12px] text-gray-600 flex-wrap">
                        <span className="rounded-full bg-transparent px-3 py-1 border border-pink-200/80">
                          {filteredProducts.length} of {products.length} products
                        </span>
                        {selectedSize && (
                          <span className="rounded-full bg-transparent px-3 py-1 border border-pink-200/80">
                            Size: <span className="font-semibold text-gray-900">{selectedSize}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-4 sm:h-6 rounded-b-[28px] bg-[#f9f9f9]" />
              </div>
            </section>

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-center font-semibold mb-4">
                {error}
              </div>
            )}

            {/* Search and Filters */}
            <div className="px-4 sm:px-6 lg:px-8 pb-6 lg:pb-8 w-full">

              {/* Compact Controls Row (search lives in the navbar) */}
              <div className="mx-auto max-w-6xl mb-5 lg:mb-6 w-full">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => (document.getElementById("site-header-search") as HTMLInputElement | null)?.focus()}
                    className="inline-flex items-center gap-2 h-11 px-4 rounded-full border border-pink-200/80 bg-transparent text-gray-700 hover:bg-pink-50 transition-colors"
                    aria-label="Focus search"
                  >
                    <Search className="h-4 w-4 text-pink-700/80" />
                    <span className="text-sm font-medium">Search</span>
                  </button>

                  {/* Sort Dropdown */}
                  <div className="flex-shrink-0">
                    {/* Mobile Select */}
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="h-11 w-11 border border-pink-200/80 bg-transparent rounded-full flex items-center justify-center sm:hidden">
                        <SlidersHorizontal className="h-5 w-5" />
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
                      <SelectTrigger className="hidden sm:flex w-44 h-11 border border-pink-200/80 bg-transparent rounded-full items-center">
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
                    <Filter className="h-5 w-5 text-pink-700/80" />
                    <span className="text-sm font-medium text-gray-800">Filters</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {filteredProducts.length} of {products.length} products
                  </div>
                </div>

                {/* Applied Filters */}
                {(selectedSize || searchQuery) && (
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {searchQuery && (
                      <div className="flex items-center gap-2 bg-white border border-pink-100 px-3 py-1.5 rounded-full text-sm shadow-sm">
                        <span className="text-gray-700">Search: “{searchQuery}”</span>
                        <button
                          onClick={() => updateURL({ q: "" })}
                          className="text-gray-500 hover:text-gray-700"
                          aria-label="Remove search filter"
                          type="button"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    {selectedSize && (
                      <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm">
                        <span className="text-gray-700">Size: {selectedSize}</span>
                        <button
                          onClick={() => handleSizeFilter(selectedSize)}
                          className="text-gray-500 hover:text-gray-700"
                          type="button"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="text-sm text-gray-600 hover:text-gray-900 underline"
                        type="button"
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
                        type="button"
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border shadow-sm ${
                          selectedSize === sizeWithCount.size
                            ? 'bg-pink-500 text-white border-pink-500'
                            : 'bg-white text-gray-800 border-pink-100 hover:bg-pink-50 hover:border-pink-200'
                        }`}
                      >
                        <span className="tabular-nums">{sizeWithCount.size}</span>
                        <span className={`ml-1 text-[12px] tabular-nums ${selectedSize === sizeWithCount.size ? "text-white/90" : "text-gray-500"}`}>
                          ({sizeWithCount.count})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid - Responsive: 2 columns on mobile, 4 on desktop */}
            {/* Products Grid - Clean Minimalist Layout */}
            <div className="px-2 sm:px-4 lg:px-8 pb-16 w-full box-border">
              <div className="mx-auto max-w-6xl">
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
                      <div className="relative aspect-[2/3] bg-white rounded-2xl overflow-hidden mb-3 shadow-sm ring-1 ring-black/5">
                        <Image
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          loading="lazy"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        
                        {/* Always visible wishlist button */}
                        <div className="absolute top-3 right-3 z-10">
                          <WishlistButton productId={product._id} size="sm" />
                        </div>
                        
                        {/* Overlay buttons on hover */}
                        <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                          <Button 
                            size="sm" 
                            className="rounded-full bg-[#E91E63] hover:bg-[#d81b60] shadow-lg"
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
                      <div className="space-y-2">
                        {/* Product Title */}
                        <h3 className="text-sm lg:text-[15px] font-semibold text-gray-900 leading-snug">
                          {product?.name || "Product"}
                        </h3>

                        {/* 1-line premium feature summary */}
                        <p className="text-[12px] text-gray-600 leading-snug line-clamp-2">
                          {getProductFeatureSummary(product, categorySlug)}
                        </p>

                        {/* Price */}
                        <div className="text-sm lg:text-[15px] text-gray-900 font-bold">
                          ₹{product.price.toLocaleString()}
                        </div>


                        {/* Simple Add to Cart Button */}
                        <Button
                          variant="outline"
                          className="w-full border border-pink-200 text-pink-700 hover:bg-[#E91E63] hover:text-white hover:border-[#E91E63] bg-white rounded-full font-medium text-sm py-2 h-auto transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-pink-500/30"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAddToCart(product)
                          }}
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
                  <Button
                    onClick={clearAllFilters}
                    variant="outline"
                    className="border border-pink-200 text-pink-700 hover:bg-[#E91E63] hover:text-white hover:border-[#E91E63] bg-white rounded-full px-6 focus-visible:ring-2 focus-visible:ring-pink-500/30"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
              </div>
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
