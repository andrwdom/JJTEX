"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import SiteHeader from "@/components/site-header"
import { fetchCategoryTree, getLeafCategories, CategoryNode } from "@/lib/category-utils"
import { ChevronRight, LayoutGrid, Sparkles } from "lucide-react"

// Map category slugs to unique images (reuse logic from home page)
const getCategoryImage = (slug: string, index: number): string => {
  const categoryImageMap: Record<string, string> = {
    'maternity-feeding-wear': '/images/categories/maternity-feeding.webp',
    'zipless-feeding-lounge-wear': '/images/categories/zipless-feeding.webp',
    'zipless-feeding-dupatta-lounge-wear': '/images/categories/dupatta-lounge.webp',
    'non-feeding-lounge-wear': '/images/categories/non-feeding.webp',
  }
  
  if (categoryImageMap[slug]) {
    return categoryImageMap[slug]
  }
  
  const imageNumber = ((index % 52) + 1)
  return `/p_img${imageNumber}.png`
}

export default function CollectionsPage() {
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadCategories() {
      setLoading(true)
      try {
        const tree = await fetchCategoryTree()
        const leafCategories = getLeafCategories(tree)
        setCategories(leafCategories.sort((a, b) => a.name.localeCompare(b.name)))
      } catch (error) {
        console.error('Failed to load categories:', error)
      } finally {
        setLoading(false)
      }
    }
    loadCategories()
  }, [])

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 pb-20">
      <SiteHeader sticky glassOnScroll />
      
      {/* Page Header */}
      <section className="pt-12 pb-8 px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 border border-pink-100 mb-4">
          <Sparkles className="h-3.5 w-3.5 text-pink-500" />
          <span className="text-[10px] font-bold tracking-widest text-pink-600 uppercase">Our Collections</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#3b2b52] mb-3 font-serif">
          Browse by Category
        </h1>
        <p className="max-w-xl mx-auto text-sm text-gray-600 leading-relaxed">
          From everyday essentials to elegant ethnic wear, explore our curated collections designed for your lifestyle.
        </p>
      </section>

      {/* Categories Grid */}
      <section className="px-4 sm:px-6 max-w-6xl mx-auto mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-48 rounded-3xl bg-gray-100 animate-pulse" />
            ))
          ) : (
            categories.map((cat, index) => (
              <button
                key={cat.slug}
                onClick={() => router.push(`/collections/${cat.slug}`)}
                className="group relative h-48 w-full overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
                  <img
                    src={getCategoryImage(cat.slug, index)}
                    alt={cat.name}
                    className="h-full w-full object-cover opacity-40 group-hover:opacity-60 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
                </div>

                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <div className="mb-2 h-12 w-12 rounded-2xl bg-white/90 shadow-sm flex items-center justify-center border border-pink-50 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
                    <LayoutGrid className="h-6 w-6 text-pink-500" />
                  </div>
                  <h3 className="text-lg font-bold text-[#3b2b52] group-hover:text-pink-600 transition-colors">
                    {cat.name}
                  </h3>
                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-pink-500 opacity-0 -translate-y-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                    Explore Collection
                    <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </section>

      {/* Empty State */}
      {!loading && categories.length === 0 && (
        <div className="text-center py-20 px-6">
          <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <LayoutGrid className="h-8 w-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No collections found</h3>
          <p className="text-gray-500 mt-1 text-sm">We're updating our store. Please check back soon.</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-6 px-6 py-2.5 bg-[#3b2b52] text-white rounded-full text-sm font-semibold hover:opacity-90 transition"
          >
            Back to Home
          </button>
        </div>
      )}
    </div>
  )
}

