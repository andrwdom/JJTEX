"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { fetchCategoryTree, getLeafCategories, CategoryTree } from "@/lib/category-utils"
import { useRouter } from "next/navigation"
import SiteHeader from "@/components/site-header"
import { fetchProducts } from "@/lib/api-utils"
import { getProductUrl } from "@/lib/product-url-utils"
import { ChevronRight, ChevronDown, FolderTree, Truck, RotateCcw, MessageSquare } from "lucide-react"
import BannerCarousel from "@/components/banner-carousel"
import TestimonialsSection from "@/components/testimonials-section"

type Highlight = {
	title: string
	image: string
	slug?: string // Category slug for navigation
}

function CategoryTreeNode({ node, level = 0 }: { node: CategoryTree, level?: number }) {
	const [isOpen, setIsOpen] = useState(false)
	const router = useRouter()
	const hasChildren = node.children && node.children.length > 0

	return (
		<div className="w-full">
			<div
				className={`group flex items-center justify-between py-5 cursor-pointer border-b border-pink-50/50 hover:bg-pink-50/40 transition-all`}
				style={{ paddingLeft: `${level * 2 + 1.5}rem`, paddingRight: '1.5rem' }}
				onClick={() => {
					if (hasChildren) {
						setIsOpen(!isOpen)
					} else {
						router.push(`/collections/${node.slug}`)
					}
				}}
			>
				<div className="flex items-center gap-4">
					<div className={`h-2.5 w-2.5 rounded-full transition-all duration-500 ${hasChildren ? (isOpen ? 'bg-pink-500 scale-125 shadow-[0_0_8px_rgba(233,30,99,0.4)]' : 'bg-pink-200') : 'bg-pink-500 shadow-[0_0_8px_rgba(233,30,99,0.2)]'}`} />
					<span className={`text-[15px] sm:text-[16px] lg:text-[17px] tracking-tight transition-colors ${level === 0 ? 'font-bold text-[#3b2b52]' : 'text-gray-700 font-medium'} group-hover:text-pink-600`}>
						{node.name}
					</span>
				</div>

				{hasChildren ? (
					<div className="flex items-center gap-4">
						<button
							onClick={(e) => {
								e.stopPropagation()
								router.push(`/collections/${node.slug}`)
							}}
							className="hidden sm:inline-flex text-[10px] lg:text-[11px] uppercase tracking-[0.2em] font-bold text-pink-400 hover:text-white px-4 py-2 rounded-full border border-pink-100 bg-white hover:bg-pink-500 hover:border-pink-500 transition-all duration-300"
						>
							View All
						</button>
						<div className={`transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}>
							<ChevronDown className="h-5 w-5 text-pink-400" />
						</div>
					</div>
				) : (
					<div className="flex items-center gap-2">
						<span className="hidden group-hover:inline text-[10px] uppercase tracking-widest text-pink-400 font-bold animate-in fade-in slide-in-from-right-2 duration-300">Browse</span>
						<ChevronRight className="h-5 w-5 text-pink-100 group-hover:text-pink-500 group-hover:translate-x-1.5 transition-all duration-300" />
					</div>
				)}
			</div>

			{hasChildren && isOpen && (
				<div className="bg-[#fff9fa]/60 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
					{node.children!.map((child) => (
						<CategoryTreeNode key={child._id} node={child} level={level + 1} />
					))}
				</div>
			)}
		</div>
	)
}

// Map category slugs to unique images
const getCategoryImage = (slug: string, index: number): string => {
	// Category-specific images (if available in /images/categories/)
	const categoryImageMap: Record<string, string> = {
		'maternity-feeding-wear': '/images/categories/maternity-feeding.webp',
		'zipless-feeding-lounge-wear': '/images/categories/zipless-feeding.webp',
		'zipless-feeding-dupatta-lounge-wear': '/images/categories/dupatta-lounge.webp',
		'non-feeding-lounge-wear': '/images/categories/non-feeding.webp',
	}

	// If category has a specific image, use it
	if (categoryImageMap[slug]) {
		return categoryImageMap[slug]
	}

	// Otherwise, cycle through available p_img files (p_img1 through p_img52)
	// Use index to ensure different categories get different images
	const imageNumber = ((index % 52) + 1) // Cycle through 1-52
	return `/p_img${imageNumber}.png`
}

// Fallback highlights if categories aren't loaded yet
const fallbackHighlights: Highlight[] = [
	// These slugs match the backend taxonomy seeding (`backend/scripts/seedTaxonomy.js`)
	{ title: "Women's Kurtas", image: "/p_img1.png", slug: "kurtas-kurtis" },
	{ title: "Women's Sarees", image: "/p_img5.png", slug: "traditional-saree" },
	{ title: "Girls Dresses", image: "/p_img3.png", slug: "dresses-jumpsuits" },
	{ title: "Boys T-Shirts", image: "/p_img4.png", slug: "tshirt" },
	{ title: "Baby Rompers", image: "/p_img7.png", slug: "rompers-body-suits" },
	{ title: "Teens Jeans", image: "/p_img6.png", slug: "jeans" },
	{ title: "Jewellery", image: "/p_img8.png", slug: "jewellery" },
]

type HomeProduct = {
	id: string
	_id?: string
	customId?: string
	name: string
	price: number
	originalPrice?: number
	images: string[]
	category: string
	categorySlug?: string
}

function useRevealOnScroll(dependency: any) {
	const refMap = useRef(new Map<string, HTMLElement>())
	const [visible, setVisible] = useState<Record<string, boolean>>({})

	useEffect(() => {
		if (typeof IntersectionObserver === "undefined") return

		const obs = new IntersectionObserver(
			(entries) => {
				entries.forEach((e) => {
					if (!e.isIntersecting) return
					const id = (e.target as HTMLElement).dataset.revealId
					if (!id) return
					setVisible((v) => ({ ...v, [id]: true }))
					obs.unobserve(e.target)
				})
			},
			{ threshold: 0.05, rootMargin: "50px" },
		)

		// Observe all registered elements
		refMap.current.forEach((el) => {
			if (el) obs.observe(el)
		})

		return () => obs.disconnect()
	}, [dependency]) // Re-run when products load

	const register = (id: string) => (el: HTMLElement | null) => {
		if (!el) {
			refMap.current.delete(id)
			return
		}
		el.dataset.revealId = id
		refMap.current.set(id, el)
	}

	return { register, visible }
}

export default function Home() {
	const [highlights, setHighlights] = useState<Highlight[]>(fallbackHighlights)
	const [categoriesLoading, setCategoriesLoading] = useState(true)
	const [categoryTree, setCategoryTree] = useState<CategoryTree[]>([])
	const [homeProducts, setHomeProducts] = useState<HomeProduct[]>([])
	const [productsLoading, setProductsLoading] = useState(true)
	const router = useRouter()
	const { register, visible } = useRevealOnScroll(homeProducts)
	// Home grid is 2 columns on mobile; cap to 6 rows => 12 items max.
	const HOME_MAX_ROWS = 6
	const HOME_GRID_COLS_MOBILE = 2
	const HOME_MAX_ITEMS = HOME_MAX_ROWS * HOME_GRID_COLS_MOBILE

	// Fetch categories and create highlights
	useEffect(() => {
		async function loadCategories() {
			setCategoriesLoading(true)
			try {
				const tree = await fetchCategoryTree()
				setCategoryTree(tree)

				// Map leaf categories to highlights (take first 7 or use fallback)
				const leafCategories = getLeafCategories(tree)
				if (leafCategories.length > 0) {
					const categoryHighlights: Highlight[] = leafCategories.slice(0, 7).map((cat, index) => ({
						title: cat.name,
						image: getCategoryImage(cat.slug, index), // Unique image per category
						slug: cat.slug
					}))
					setHighlights(categoryHighlights)
				} else {
					// Use fallback if no categories found
					setHighlights(fallbackHighlights)
					setCategoryTree([])
				}
			} catch (error) {
				console.error('Failed to load categories:', error)
				// Use fallback on error
				setHighlights(fallbackHighlights)
				setCategoryTree([])
			} finally {
				setCategoriesLoading(false)
			}
		}
		loadCategories()
	}, [])

	// Fetch homepage products (latest / curated)
	useEffect(() => {
		async function loadProducts() {
			setProductsLoading(true)
			try {
				// Force refresh so newly-added admin products appear immediately.
				const res = await fetchProducts({ limit: String(HOME_MAX_ITEMS), sortBy: "createdAt", sortOrder: "desc" }, true)
				const data = await res.json()
				const raw = Array.isArray(data) ? data : (data?.products || data?.data?.products || data?.data || [])

				const mapped: HomeProduct[] = (raw || []).slice(0, HOME_MAX_ITEMS).map((p: any) => ({
					id: String(p.customId || p._id),
					_id: String(p._id || ""),
					customId: p.customId ? String(p.customId) : undefined,
					name: p.name || "JJTextiles Pick",
					price: Number(p.price || 0),
					originalPrice: p.originalPrice != null ? Number(p.originalPrice) : undefined,
					images: Array.isArray(p.images) && p.images.length ? p.images : [p.image || "/placeholder.svg"],
					category: p.category || "featured",
					categorySlug: p.categorySlug,
				}))

				setHomeProducts(mapped)
			} catch (e) {
				console.error("Failed to load homepage products:", e)
				setHomeProducts([])
			} finally {
				setProductsLoading(false)
			}
		}
		loadProducts()
	}, [HOME_MAX_ITEMS])

	const seasonalSubtitle = useMemo(() => {
		const month = new Date().getMonth() // 0-11
		if (month === 11 || month === 0) return "A symphony of textures for the modern winter—soft layers, quiet glow, effortless elegance."
		if (month >= 1 && month <= 2) return "Fresh silhouettes for late-winter light—clean lines, gentle color, and breathable comfort."
		if (month >= 3 && month <= 5) return "Spring’s first flourish—airy fabrics, romantic prints, and everyday polish."
		if (month >= 6 && month <= 8) return "Summer ease, elevated—light drape, sun-ready color, and movement that feels free."
		return "Transitional pieces with editorial poise—made to carry you from day to evening with ease."
	}, [])

	const handleHighlightClick = (highlight: Highlight) => {
		if (highlight.slug) {
			// Navigate to category page using slug
			router.push(`/collections/${highlight.slug}`)
		} else {
			// Fallback: try to generate slug from title
			const slug = highlight.title.toLowerCase()
				.replace(/'/g, '')
				.replace(/\s+/g, '-')
			router.push(`/collections/${slug}`)
		}
	}


	return (
		<div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
			<SiteHeader seamless sticky glassOnScroll />

			{/* Category rail */}
			<section className="bg-[#fce4ec] pt-3 pb-4 border-b border-pink-100/50 flex justify-center">
				<div
					className="no-scrollbar flex gap-5 overflow-x-auto px-4 py-2 sm:px-10 lg:gap-12"
					style={{ WebkitOverflowScrolling: "touch" }}
				>
					{highlights.map((item) => (
						<button
							key={item.title}
							onClick={() => handleHighlightClick(item)}
							className="group flex w-[84px] flex-col items-center shrink-0 cursor-pointer transition-transform duration-300 ease-in-out"
						>
							<div className="h-16 w-16 rounded-full bg-white ring-1 ring-pink-200/80 shadow-[0_0_0_3px_rgba(233,30,99,0.06)] overflow-hidden transition-transform duration-300 ease-in-out group-hover:scale-[1.05]">
								<img
									src={item.image}
									alt={item.title}
									className="h-full w-full object-cover"
									loading="lazy"
								/>
							</div>
							<p className="mt-2 text-center text-[11px] leading-tight text-gray-700 group-hover:text-gray-900 transition-colors duration-300">
								{item.title}
							</p>
						</button>
					))}
				</div>
			</section>

			{/* Hero banner - Dynamic Carousel */}
			<section className="bg-gradient-to-b from-[#fce4ec] to-white px-4 pb-6 sm:px-6 lg:px-8">
				<div className="max-w-7xl mx-auto">
					<BannerCarousel
						autoPlay={true}
						interval={5000}
						showArrows={true}
						showDots={true}
						className="rounded-2xl shadow-sm"
					/>
				</div>
			</section>

			{/* Promotional banner strip */}
			<section className="bg-[#3b2b52] py-2.5 px-4">
				<p className="text-center text-[11px] sm:text-[12px] text-white/90 tracking-wide font-medium">
					🚚 Free delivery on orders above ₹999 &nbsp;·&nbsp; ↩️ Easy returns &nbsp;·&nbsp; 🔒 Secure payments
				</p>
			</section>

			{/* Trust badges strip */}
			<section className="bg-white border-b border-gray-100 py-5 px-4 sm:px-6">
				<div className="max-w-5xl mx-auto grid grid-cols-3 gap-3 sm:gap-6">
					<div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 text-center sm:text-left">
						<span className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-pink-500/15 to-purple-500/10 flex items-center justify-center shrink-0">
							<Truck className="h-4 w-4 sm:h-5 sm:w-5 text-pink-600" />
						</span>
						<div>
							<p className="font-semibold text-[12px] sm:text-[13px] text-[#3b2b52]">Fast Delivery</p>
							<p className="text-[10px] sm:text-[11px] text-gray-500 block">Delivered in 3-4 working days</p>
						</div>
					</div>
					<div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 text-center sm:text-left">
						<span className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-pink-500/15 to-purple-500/10 flex items-center justify-center shrink-0">
							<RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 text-pink-600" />
						</span>
						<div>
							<p className="font-semibold text-[12px] sm:text-[13px] text-[#3b2b52]">Easy Returns</p>
							<p className="text-[10px] sm:text-[11px] text-gray-500 block">Hassle-free 7 day return</p>
						</div>
					</div>
					<div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 text-center sm:text-left">
						<span className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-pink-500/15 to-purple-500/10 flex items-center justify-center shrink-0">
							<MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-pink-600" />
						</span>
						<div>
							<p className="font-semibold text-[12px] sm:text-[13px] text-[#3b2b52]">Instant Support</p>
							<p className="text-[10px] sm:text-[11px] text-gray-500 block">Email & Instagram help</p>
						</div>
					</div>
				</div>
			</section>

			{/* Latest Collections */}
			<section className="mt-10 sm:mt-16 lg:mt-24 px-6 max-w-7xl mx-auto w-full">
				<div className="flex items-center">
					<div className="h-px flex-1 bg-black/10" />
					<h2 className="mx-4 text-center text-[14px] sm:text-[16px] lg:text-[18px] font-bold tracking-[0.3em] text-gray-900 uppercase">
						LATEST COLLECTIONS
					</h2>
					<div className="h-px flex-1 bg-black/10" />
				</div>
				<p className="mt-3 text-center text-[12px] sm:text-[13px] text-gray-600 max-w-2xl mx-auto leading-relaxed">
					{seasonalSubtitle}
				</p>
				<div className="mt-3 text-center">
					<button
						onClick={() => router.push('/collections')}
						className="text-[12px] sm:text-[13px] font-semibold text-pink-600 hover:text-pink-700 transition-colors inline-flex items-center gap-1"
					>
						View All <ChevronRight className="h-3.5 w-3.5" />
					</button>
				</div>
			</section>

			{/* Product grid */}
			<section className="mt-8 lg:mt-12 px-4 sm:px-6 lg:px-8 pb-20 max-w-7xl mx-auto w-full">
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-x-4 gap-y-10 sm:gap-8 lg:gap-10">
					{(productsLoading ? Array.from({ length: HOME_MAX_ITEMS }).map((_, i) => ({ id: `sk-${i}` })) : homeProducts).map((p: any, idx: number) => {
						const id = p.id || `sk-${idx}`
						const isVisible = visible[id]
						const img1 = p?.images?.[0] || "/placeholder.svg"
						const img2 = p?.images?.[1] || ""
						const title = p?.name || "JJTextiles Pick"
						const price = typeof p?.price === "number" ? p.price : 0
						const originalPrice = typeof p?.originalPrice === "number" ? p.originalPrice : undefined
						const url = p?.id ? getProductUrl(p.id, p.categorySlug) : "#"

						// Fallback: If not using reveal, or for skeletons, just show.
						const show = isVisible || productsLoading

						return (
							<article
								key={id}
								ref={register(id)}
								onClick={() => url !== "#" && router.push(url)}
								className={[
									"group cursor-pointer",
									"transition-all duration-500 ease-in-out",
									show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
								].join(" ")}
								style={{ willChange: "transform, opacity" }}
							>
								<div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#f9f9f9]">
									<img
										src={img1}
										alt={title}
										className="h-full w-full object-cover transition-opacity duration-300 ease-in-out group-hover:opacity-0"
										loading="lazy"
									/>
									{img2 ? (
										<img
											src={img2}
											alt={`${title} lifestyle`}
											className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
											loading="lazy"
										/>
									) : (
										<div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100">
											<span className="rounded-full bg-white/80 backdrop-blur px-4 py-2 text-xs font-semibold text-gray-900 border border-pink-100">
												Quick View
											</span>
										</div>
									)}
									{/* Discount badge */}
									{originalPrice && originalPrice > price && (
										<div className="absolute top-2 left-2 bg-[#E91E63] text-white px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold shadow-md z-10">
											{Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF
										</div>
									)}
								</div>

								{/* Minimalist-modern info: transparent background, bottom border only */}
								<div className="pt-3 pb-2 border-b border-black/10">
									<h3 className="text-[13px] sm:text-[14px] font-medium text-gray-900 line-clamp-1">
										{title}
									</h3>
									<div className="mt-1 flex items-center gap-2">
										<p className="text-[13px] font-semibold text-gray-900">₹{price.toLocaleString()}</p>
										{originalPrice && originalPrice > price && (
											<span className="text-[12px] text-gray-400 line-through">₹{originalPrice.toLocaleString()}</span>
										)}
									</div>
								</div>
							</article>
						)
					})}
				</div>
			</section>

			{/* Social Proof - Testimonials */}
			<TestimonialsSection />

			{/* Shop more by Category */}
			<section className="px-4 sm:px-6 pb-16 max-w-4xl mx-auto w-full">
				<div className="flex items-center mb-12 lg:mb-16">
					<div className="h-px flex-1 bg-gradient-to-r from-transparent to-black/10" />
					<div className="flex flex-col items-center mx-8 text-center">
						<div className="h-14 w-14 rounded-2xl bg-pink-50 flex items-center justify-center mb-4 border border-pink-100 shadow-sm transition-all duration-500 hover:rotate-12 hover:scale-110">
							<FolderTree className="h-7 w-7 text-pink-500" />
						</div>
						<h2 className="text-[16px] sm:text-[18px] lg:text-[20px] font-bold tracking-[0.25em] text-[#3b2b52] uppercase font-serif">
							Shop by Category
						</h2>
						<p className="mt-2 text-[12px] text-gray-500 italic tracking-widest uppercase">
							Browse our curated collections
						</p>
					</div>
					<div className="h-px flex-1 bg-gradient-to-l from-transparent to-black/10" />
				</div>

				<div className="bg-white rounded-[2.5rem] lg:rounded-[3rem] border border-pink-100/60 shadow-[0_20px_60px_rgba(255,182,193,0.18)] overflow-hidden transition-all duration-500 hover:shadow-[0_30px_80px_rgba(255,182,193,0.22)]">
					{categoriesLoading ? (
						<div className="p-8 space-y-6">
							{Array.from({ length: 5 }).map((_, i) => (
								<div key={i} className="flex items-center justify-between">
									<div className="flex items-center gap-4">
										<div className="h-2 w-2 rounded-full bg-pink-100 animate-pulse" />
										<div className="h-5 w-40 bg-gray-50 rounded-lg animate-pulse" />
									</div>
									<div className="h-5 w-5 bg-gray-50 rounded-full animate-pulse" />
								</div>
							))}
						</div>
					) : (
						<div className="divide-y divide-pink-50/40">
							{categoryTree.map((cat) => (
								<CategoryTreeNode key={cat._id} node={cat} />
							))}
						</div>
					)}
				</div>

				{!categoriesLoading && categoryTree.length === 0 && (
					<div className="text-center py-16 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
						<p className="text-sm text-gray-400">Our collection catalog is being updated.</p>
					</div>
				)}
			</section>

			{/* Hide horizontal scrollbar utility */}
			<style jsx global>{`
				.no-scrollbar::-webkit-scrollbar {
					display: none;
				}
				.no-scrollbar {
					-ms-overflow-style: none;
					scrollbar-width: none;
				}
			`}</style>
		</div>
	)
}
