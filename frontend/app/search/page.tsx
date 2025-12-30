"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import SiteHeader from "@/components/site-header"
import ProductCardOptimized from "@/components/product-card-optimized"
import PageLoading from "@/components/page-loading"
import { Search, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface Product {
  id: string
  _id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  images?: string[]
  category: string
  categorySlug?: string
  description?: string
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const searchQuery = searchParams.get('q') || ''

  useEffect(() => {
    if (!searchQuery.trim()) {
      setLoading(false)
      setProducts([])
      return
    }

    const fetchSearchResults = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
        const origin = baseUrl ? baseUrl.replace(/\/$/, '') : ''
        const apiUrl = `${origin}/api/products?search=${encodeURIComponent(searchQuery)}&limit=100`
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch search results: ${response.status}`)
        }

        const data = await response.json()
        const productsList = data.products || data.data || []
        
        const formattedProducts: Product[] = productsList.map((p: any) => ({
          id: String(p._id || p.id),
          _id: String(p._id || p.id),
          name: p.name || 'Untitled Product',
          price: p.price || 0,
          originalPrice: p.originalPrice,
          image: (Array.isArray(p.images) && p.images.length > 0) ? p.images[0] : '/placeholder.svg',
          images: p.images || [],
          category: p.category || '',
          categorySlug: p.categorySlug,
          description: p.description,
        }))

        setProducts(formattedProducts)
      } catch (err) {
        console.error('Search error:', err)
        setError(err instanceof Error ? err.message : 'Failed to search products')
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchSearchResults()
  }, [searchQuery])

  const handleProductClick = (product: Product) => {
    const { getProductUrl } = require('@/lib/product-url-utils')
    const url = getProductUrl(product.id, product.categorySlug)
    window.location.href = url
  }

  return (
    <div className="min-h-screen bg-white">
      {/* SiteHeader is rendered by layout-client */}
      
      <PageLoading loadingMessage="Searching products..." minLoadingTime={500}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {searchQuery ? `Search Results for "${searchQuery}"` : 'Search Products'}
                </h1>
                {searchQuery && (
                  <p className="text-gray-600">
                    {loading ? 'Searching...' : `${products.length} product${products.length !== 1 ? 's' : ''} found`}
                  </p>
                )}
              </div>
              {searchQuery && (
                <button
                  onClick={() => router.push('/search')}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <Search className="h-12 w-12 mx-auto opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Search Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* No Results State */}
          {!loading && !error && searchQuery && products.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">
                We couldn't find any products matching "{searchQuery}"
              </p>
              <p className="text-sm text-gray-500">
                Try different keywords or browse our collections
              </p>
            </div>
          )}

          {/* Empty Search State */}
          {!loading && !error && !searchQuery && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start Searching</h3>
              <p className="text-gray-600">
                Enter a search term in the search bar above to find products
              </p>
            </div>
          )}

          {/* Results Grid */}
          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((product, index) => (
                <ProductCardOptimized
                  key={product.id}
                  product={product}
                  index={index}
                  onClick={() => handleProductClick(product)}
                />
              ))}
            </div>
          )}
        </div>
      </PageLoading>
    </div>
  )
}

