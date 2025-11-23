// Utility functions for generating product URLs with category structure

/**
 * Generate product URL with category structure
 * Format: /[category-name]/product/[product-id]
 * 
 * @param productId - Product ID (customId or _id)
 * @param categorySlug - Category slug from product
 * @returns URL path
 */
export function getProductUrl(productId: string, categorySlug?: string): string {
  if (categorySlug) {
    // Extract category name from slug (first part before any subcategory)
    const categoryParts = categorySlug.split('/')
    const categoryName = categoryParts[0] || categorySlug.split('-')[0] || 'product'
    return `/${categoryName}/product/${productId}`
  }
  
  // Fallback to old URL structure if no category slug
  return `/product/${productId}`
}

/**
 * Extract category name from category slug
 * @param categorySlug - Full category slug (e.g., "women/ethnic-wear/kurtas-kurtis")
 * @returns Category name (e.g., "women")
 */
export function extractCategoryName(categorySlug: string): string {
  if (!categorySlug) return 'product'
  
  // If it's a path, take the first part
  if (categorySlug.includes('/')) {
    return categorySlug.split('/')[0]
  }
  
  // If it's a single slug, try to extract the main category
  // For example: "women-ethnic-wear" -> "women"
  const parts = categorySlug.split('-')
  
  // Common category prefixes
  const mainCategories = ['women', 'men', 'kids', 'baby', 'teens', 'girls', 'boys']
  for (const cat of mainCategories) {
    if (categorySlug.toLowerCase().startsWith(cat)) {
      return cat
    }
  }
  
  // Default: use first part or whole slug
  return parts[0] || categorySlug
}

/**
 * Generate category page URL
 * Uses existing /collections/[categorySlug] structure
 * 
 * @param categorySlug - Category slug
 * @returns URL path
 */
export function getCategoryUrl(categorySlug: string): string {
  return `/collections/${categorySlug}`
}

