// Category utilities for fetching and managing categories from backend

export interface CategoryNode {
  _id: string
  name: string
  slug: string
  path: string
  parent?: string | null
  order?: number
  isLeaf: boolean
  productCount?: number
  children?: CategoryNode[]
}

export interface CategoryTree extends CategoryNode {
  children?: CategoryTree[]
}

/**
 * Fetch category tree from backend API
 * @param forceRefresh - Bypass cache and fetch fresh data
 * @returns Category tree array
 */
export async function fetchCategoryTree(forceRefresh: boolean = false): Promise<CategoryTree[]> {
  // Prefer same-origin in the browser to avoid adblock/privacy tools blocking localhost:4000 calls.
  // If you deploy frontend + backend on different origins, set NEXT_PUBLIC_API_URL.
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
  const basePath = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/categories/tree` : '/api/categories/tree'

  const params = new URLSearchParams()
  if (forceRefresh) params.set('_t', Date.now().toString())

  const fullUrl = params.toString() ? `${basePath}?${params.toString()}` : basePath
  
  try {
    // Use safeFetch from api-health for better error handling
    const { safeFetch } = await import('@/lib/api-health')
    
    const response = await safeFetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })
    
    if (!response || !response.ok) {
      throw new Error(`API error: ${response?.status || 'Network error'}`)
    }
    
    const data = await response.json()
    
    // Handle different response formats
    if (data.success && data.data) {
      return data.data as CategoryTree[]
    } else if (Array.isArray(data)) {
      return data as CategoryTree[]
    } else if (data.data && Array.isArray(data.data)) {
      return data.data as CategoryTree[]
    }
    
    throw new Error('Invalid category tree response format')
  } catch (error) {
    console.error('Failed to fetch category tree:', error)
    // Return empty array on error - components should handle this gracefully
    return []
  }
}

/**
 * Flatten category tree into a flat array
 * @param tree - Category tree array
 * @returns Flat array of all categories
 */
export function flattenCategoryTree(tree: CategoryTree[]): CategoryNode[] {
  const result: CategoryNode[] = []
  
  function traverse(nodes: CategoryTree[]) {
    for (const node of nodes) {
      result.push(node)
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    }
  }
  
  traverse(tree)
  return result
}

/**
 * Find category by slug in tree
 * @param tree - Category tree array
 * @param slug - Category slug to find
 * @returns Category node or null
 */
export function findCategoryBySlug(tree: CategoryTree[], slug: string): CategoryNode | null {
  for (const node of tree) {
    if (node.slug === slug) {
      return node
    }
    if (node.children) {
      const found = findCategoryBySlug(node.children, slug)
      if (found) return found
    }
  }
  return null
}

/**
 * Get breadcrumbs for a category by slug
 * @param tree - Category tree array
 * @param slug - Category slug
 * @returns Array of breadcrumb items (path from root to category)
 */
export function getCategoryBreadcrumbs(tree: CategoryTree[], slug: string): Array<{ name: string; slug: string; path: string }> {
  function findPath(nodes: CategoryTree[], targetSlug: string, path: Array<{ name: string; slug: string; path: string }> = []): Array<{ name: string; slug: string; path: string }> | null {
    for (const node of nodes) {
      const currentPath = [...path, { name: node.name, slug: node.slug, path: node.path }]
      
      if (node.slug === targetSlug) {
        return currentPath
      }
      
      if (node.children) {
        const found = findPath(node.children, targetSlug, currentPath)
        if (found) return found
      }
    }
    return null
  }
  
  return findPath(tree, slug) || []
}

/**
 * Get all leaf categories (categories that can have products)
 * @param tree - Category tree array
 * @returns Array of leaf category nodes
 */
export function getLeafCategories(tree: CategoryTree[]): CategoryNode[] {
  const result: CategoryNode[] = []
  
  function traverse(nodes: CategoryTree[]) {
    for (const node of nodes) {
      if (node.isLeaf || !node.children || node.children.length === 0) {
        result.push(node)
      } else {
        traverse(node.children)
      }
    }
  }
  
  traverse(tree)
  return result
}

/**
 * Transform category tree to match frontend navigation structure
 * This converts the hierarchical tree to a structure like:
 * {
 *   kids: { girls: [...], boys: [...] },
 *   women: { ethnic: [...], western: [...] }
 * }
 */
export function transformCategoryTreeForNavigation(tree: CategoryTree[]): {
  [key: string]: {
    [key: string]: string[]
  }
} {
  const result: { [key: string]: { [key: string]: string[] } } = {}
  
  for (const rootCategory of tree) {
    const rootKey = rootCategory.slug.toLowerCase()
    result[rootKey] = {}
    
    if (rootCategory.children) {
      for (const subCategory of rootCategory.children) {
        const subKey = subCategory.slug.toLowerCase()
        result[rootKey][subKey] = []
        
        if (subCategory.children) {
          for (const leafCategory of subCategory.children) {
            result[rootKey][subKey].push(leafCategory.name)
          }
        } else {
          // If no children, add the subcategory itself
          result[rootKey][subKey].push(subCategory.name)
        }
      }
    }
  }
  
  return result
}

