import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

/**
 * CategoryPicker
 * - Fetches /api/categories/tree
 * - Renders cascading selects from root → children
 * - Calls onChange with selected leaf (name, slug, path, breadcrumbs)
 *
 * Props:
 * - backendUrl: string
 * - token?: string
 * - initialSlug?: string (preselect by leaf slug)
 * - onChange: (selection|null) => void
 * - requiredLeaf?: boolean (defaults true)
 * - label?: string
 */
const CategoryPicker = ({
  backendUrl,
  token,
  initialSlug,
  onChange,
  requiredLeaf = true,
  label = 'Category'
}) => {
  const [tree, setTree] = useState([])
  const [levels, setLevels] = useState([]) // array of selected nodes by depth
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const headers = useMemo(() => (token ? { token } : {}), [token])

  useEffect(() => {
    const fetchTree = async () => {
      setLoading(true)
      setError(null)
      try {
        // Try primary URL then a small set of safe fallbacks for www/non-www
        const candidates = Array.from(new Set([
          `${backendUrl}`,
          backendUrl.replace('https://www.', 'https://'),
          backendUrl.replace('https://', 'https://www.'),
        ]))
        let res = null
        let lastError = null
        for (const base of candidates) {
          try {
            res = await axios.get(`${base}/api/categories/tree`, { headers })
            break
          } catch (err) {
            lastError = err
          }
        }
        if (!res) throw lastError || new Error('Network error')
        if (res.data?.success) {
          setTree(res.data.data || [])
        } else {
          // some controllers return raw array without wrapper
          setTree(Array.isArray(res.data) ? res.data : (res.data?.data || []))
        }
      } catch (e) {
        setError(e?.response?.data?.message || e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchTree()
  }, [backendUrl, headers])

  // Find path to a node by slug in the tree
  const findPathBySlug = (nodes, slug, path = []) => {
    for (const node of nodes) {
      const newPath = [...path, node]
      if (node.slug === slug) return newPath
      if (node.children?.length) {
        const childPath = findPathBySlug(node.children, slug, newPath)
        if (childPath) return childPath
      }
    }
    return null
  }

  // Preselect based on initialSlug
  useEffect(() => {
    if (!initialSlug || tree.length === 0) return
    const path = findPathBySlug(tree, initialSlug)
    if (path) {
      setLevels(path)
      const leaf = path[path.length - 1]
      onChange?.({
        name: leaf.name,
        slug: leaf.slug,
        path: leaf.path,
        isLeaf: !!leaf.isLeaf,
        breadcrumbs: path.map(n => ({ name: n.name, slug: n.slug, path: n.path }))
      })
    }
  }, [initialSlug, tree])

  const getOptionsForDepth = (depth) => {
    if (depth === 0) return tree
    const parent = levels[depth - 1]
    return parent?.children || []
  }

  const handleSelect = (depth, slug) => {
    // Build new levels up to this depth
    const newLevels = levels.slice(0, depth)
    const options = getOptionsForDepth(depth)
    const selected = options.find(o => o.slug === slug) || null
    if (selected) {
      newLevels[depth] = selected
    }
    // Clear deeper selections
    setLevels(newLevels)

    // Determine selected leaf if any
    const current = newLevels[newLevels.length - 1]
    if (current) {
      const isLeaf = !current.children || current.children.length === 0 || !!current.isLeaf
      const breadcrumbs = newLevels.map(n => ({ name: n.name, slug: n.slug, path: n.path }))
      const selection = {
        name: current.name,
        slug: current.slug,
        path: current.path,
        isLeaf,
        breadcrumbs
      }
      if (requiredLeaf) {
        if (isLeaf) onChange?.(selection)
        else onChange?.(null)
      } else {
        onChange?.(selection)
      }
    } else {
      onChange?.(null)
    }
  }

  // Determine how many levels to render: at least 1; if a level is selected and has children, render next select.
  const renderedDepths = useMemo(() => {
    const depths = [0]
    let depth = 0
    while (true) {
      const selected = levels[depth]
      if (selected && selected.children && selected.children.length) {
        depth += 1
        depths.push(depth)
      } else {
        break
      }
    }
    return depths
  }, [levels])

  return (
    <div className='w-full'>
      <label className='block text-sm font-medium text-gray-700 mb-2'>{label}</label>
      {loading && (
        <div className='text-sm text-gray-500'>Loading categories…</div>
      )}
      {error && (
        <div className='text-sm text-red-600'>Failed to load categories: {error}</div>
      )}
      {!loading && !error && (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {renderedDepths.map((depth) => {
            const options = getOptionsForDepth(depth)
            const selectedSlug = levels[depth]?.slug || ''
            return (
              <select
                key={depth}
                value={selectedSlug}
                onChange={(e) => handleSelect(depth, e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              >
                <option value=''>{depth === 0 ? 'Select parent category' : 'Select subcategory'}</option>
                {options.map(opt => (
                  <option key={opt.slug} value={opt.slug}>
                    {opt.name}
                  </option>
                ))}
              </select>
            )
          })}
        </div>
      )}
      {requiredLeaf && levels.length > 0 && levels[levels.length - 1] && levels[levels.length - 1].children && levels[levels.length - 1].children.length > 0 && (
        <p className='mt-2 text-xs text-amber-600'>Please select down to the final subcategory.</p>
      )}
    </div>
  )
}

export default CategoryPicker


