"use client"

import React, { useState, useEffect } from "react"
import {
	AlignJustify,
	ShoppingCart,
	User,
	Search as SearchIcon
} from "lucide-react"
import MobileMenuSidebar from "@/components/mobile-menu-sidebar"
import { useCart } from "@/components/cart-context"
import { useAuth } from "@/components/auth/useAuth"
import LoginModal from "@/components/auth/LoginModal"
import { fetchCategoryTree, getLeafCategories, CategoryTree } from "@/lib/category-utils"
import { useRouter } from "next/navigation"

type Highlight = {
	title: string
	image: string
	slug?: string // Category slug for navigation
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

const products = Array.from({ length: 6 }).map((_, i) => {
	const productImages = ["/p_img1.png", "/p_img2.png", "/p_img3.png", "/p_img4.png", "/p_img5.png", "/p_img6.png"]
	return {
		id: i + 1,
		title: ["Floral Kurta", "Classic Saree", "Girls Dress", "Boys Tee", "Baby Romper", "Teens Jeans"][i % 6],
		price: ["₹799", "₹1,499", "₹699", "₹399", "₹499", "₹999"][i % 6],
		originalPrice: ["₹1,299", "₹2,499", "₹1,199", "₹699", "₹899", "₹1,799"][i % 6],
		image: productImages[i % productImages.length],
	}
})

export default function Home() {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
	const [highlights, setHighlights] = useState<Highlight[]>(fallbackHighlights)
	const [categoriesLoading, setCategoriesLoading] = useState(true)
	const { openCartSidebar, cartItems } = useCart()
	const { user } = useAuth()
	const router = useRouter()

	const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)

	// Fetch categories and create highlights
	useEffect(() => {
		async function loadCategories() {
			setCategoriesLoading(true)
			try {
				const tree = await fetchCategoryTree()
				const leafCategories = getLeafCategories(tree)
				
				// Map leaf categories to highlights (take first 7 or use fallback)
				if (leafCategories.length > 0) {
					const categoryHighlights: Highlight[] = leafCategories.slice(0, 7).map(cat => ({
						title: cat.name,
						image: "/p_img1.png", // Default image, can be enhanced later with category images
						slug: cat.slug
					}))
					setHighlights(categoryHighlights)
				} else {
					// Use fallback if no categories found
					setHighlights(fallbackHighlights)
				}
			} catch (error) {
				console.error('Failed to load categories:', error)
				// Use fallback on error
				setHighlights(fallbackHighlights)
			} finally {
				setCategoriesLoading(false)
			}
		}
		loadCategories()
	}, [])

	const handleAccountClick = () => {
		if (user) {
			window.location.href = "/account"
		} else {
			setIsLoginModalOpen(true)
		}
	}

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
		<div className="min-h-screen bg-white font-sans text-gray-900">
			{/* Light pink header with soft bottom curve */}
			<header
				className="relative bg-[#FCDDF3] text-[#1f1f1f] px-4 pt-3 pb-4 rounded-b-[28px]"
				style={{ boxShadow: "0 2px 0 rgba(0,0,0,0.02) inset" }}
			>
				<div className="flex items-center justify-between mb-4">
					<button
						aria-label="Menu"
						className="p-2 hover:bg-white/30 rounded-lg transition-colors duration-200"
						onClick={() => setIsMobileMenuOpen(true)}
					>
						<AlignJustify className="h-6 w-6 text-[#1f1f1f]" />
					</button>
					<div className="flex items-center justify-center">
						<button
							onClick={() => (window.location.href = "/")}
							className="cursor-pointer"
						>
							<img
								src="/logo1.png"
								alt="JJ Textiles"
								className="h-10 w-auto mx-auto"
							/>
						</button>
					</div>
					<div className="flex items-center gap-3">
						<button
							aria-label="Cart"
							className="p-2 hover:bg-white/30 rounded-lg transition-colors duration-200 relative"
							onClick={openCartSidebar}
						>
							<ShoppingCart className="h-6 w-6 text-[#1f1f1f]" />
							{cartCount > 0 && (
								<span className="absolute top-0 right-0 bg-[#E91E63] text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
									{cartCount > 9 ? "9+" : cartCount}
								</span>
							)}
						</button>
						<button
							aria-label="Account"
							className="p-2 hover:bg-white/30 rounded-lg transition-colors duration-200"
							onClick={handleAccountClick}
						>
							<User className="h-6 w-6 text-[#1f1f1f]" />
						</button>
					</div>
				</div>

				{/* Search bar inside pink header */}
				<div className="px-0 pb-2">
					<div className="relative">
						<div className="flex items-center gap-2 bg-white rounded-full shadow-lg px-4 py-3">
							<SearchIcon className="h-5 w-5 text-gray-500" />
							<input
								type="text"
								placeholder="Search for brands and products"
								className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
								aria-label="Search"
							/>
						</div>
					</div>
				</div>
			</header>

			{/* Mobile Menu Sidebar */}
			<MobileMenuSidebar
				isOpen={isMobileMenuOpen}
				onClose={() => setIsMobileMenuOpen(false)}
			/>

			{/* Login Modal */}
			<LoginModal
				open={isLoginModalOpen}
				onClose={() => setIsLoginModalOpen(false)}
				onSuccess={() => {
					setIsLoginModalOpen(false)
				}}
			/>

			{/* Category rail */}
			<section className="mt-4 px-3">
				<div
					className="no-scrollbar flex gap-3 overflow-x-auto py-1"
					style={{ WebkitOverflowScrolling: "touch" }}
				>
					{highlights.map((item) => (
						<button
							key={item.title}
							onClick={() => handleHighlightClick(item)}
							className="flex w-[78px] flex-col items-center shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
						>
							<div className="h-16 w-16 rounded-full bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
								<img
									src={item.image}
									alt={item.title}
									className="h-full w-full object-cover"
									loading="lazy"
								/>
							</div>
							<p className="mt-2 text-center text-[11px] leading-tight text-gray-700">
								{item.title}
							</p>
						</button>
					))}
				</div>
			</section>

			{/* Hero banner */}
			<section className="mt-4 px-4">
				<div className="relative rounded-lg overflow-hidden">
					<img
						src="/hero_img.png"
						alt="Big Winter Bonanza"
						className="h-64 sm:h-72 w-full object-cover"
					/>
					<div className="absolute inset-0 bg-black/30" />
					<div className="absolute left-4 top-4">
						<p className="text-[10px] uppercase tracking-wider text-white/90">
							Big Winter Bonanza
						</p>
						<h3 className="mt-1 text-xl font-extrabold text-white">40–80% OFF</h3>
						<button className="mt-2 rounded-full bg-[#E91E63] px-3 py-1.5 text-xs font-semibold text-white">
							Shop Now
						</button>
					</div>
				</div>
			</section>

			{/* Latest Collections */}
			<section className="mt-12 sm:mt-16 px-6">
				<div className="flex items-center">
					<div className="h-px flex-1 bg-gray-200" />
					<h2 className="mx-3 text-center text-[18px] font-extrabold tracking-wide text-[#E91E63]">
						LATEST COLLECTIONS
					</h2>
					<div className="h-px flex-1 bg-gray-200" />
				</div>
				<p className="mt-2 text-center text-[12px] text-gray-600">
					New styles that celebrate tradition, comfort, and everyday elegance
				</p>
			</section>

			{/* Product grid */}
			<section className="mt-5 px-3 pb-20">
				<div className="grid grid-cols-2 gap-3">
					{products.map((p) => (
						<article
							key={p.id}
							className="rounded-lg border border-gray-100 overflow-hidden bg-white"
						>
							<div className="aspect-[3/4] w-full bg-gray-100">
								<img
									src={p.image}
									alt={p.title}
									className="h-full w-full object-cover"
									loading="lazy"
								/>
							</div>
							<div className="p-2">
								<h3 className="line-clamp-1 text-[13px] font-medium text-gray-800">
									{p.title}
								</h3>
								<div className="mt-0.5 flex items-center gap-2">
									<p className="text-[12px] font-bold text-gray-900">{p.price}</p>
									{p.originalPrice && (
										<span className="text-[11px] text-gray-400 line-through">
											{p.originalPrice}
										</span>
									)}
								</div>
							</div>
						</article>
					))}
				</div>
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
