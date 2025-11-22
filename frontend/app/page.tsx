"use client"

import React from "react"
import {
	AlignJustify,
	ShoppingCart,
	User,
	Search as SearchIcon
} from "lucide-react"

type Highlight = {
	title: string
	image: string
}

// Top highlights to show in the horizontal rail (mixed categories)
const topHighlights: Highlight[] = [
	{ title: "Women's Kurtas", image: "/images/categories/maternity-feeding.webp" },
	{ title: "Women's Sarees", image: "/images/categories/dupatta-lounge.webp" },
	{ title: "Girls Dresses", image: "/images/categories/zipless-feeding.webp" },
	{ title: "Boys T-Shirts", image: "/p_img4.png" },
	{ title: "Baby Rompers", image: "/images/categories/non-feeding.webp" },
	{ title: "Teens Jeans", image: "/p_img6.png" },
	{ title: "Jewellery", image: "/images/placeholder.webp" },
]

// Full category object (exact structure)
const categories = {
	kids: {
		girls: [
			"Dresses & Jumpsuits",
			"Tops & Tees",
			"Ethnic Wear",
			"Skirts & Shorts",
			"Jeans",
			"Clothing Set",
			"Innerwear",
		],
		boys: [
			"T-shirt",
			"Clothing Set",
			"Ethnic Wear",
			"Bottoms",
			"Shirts",
			"Jeans",
			"Innerwear",
		],
		baby: [
			"Rompers & Body Suits",
			"Clothing Set",
			"Dresses",
			"Tops",
			"Bottoms",
			"Accessories",
		],
		teens: [
			"T-shirt",
			"Shirts",
			"Jeans",
			"Ethnic Wear",
			"Dresses",
			"Innerwear",
		],
	},
	women: {
		ethnic: [
			"Kurtas & Kurtis",
			"Kurta Set",
			"Traditional Saree",
			"Party Wear Saree",
			"Lehengas",
			"Dupattas",
		],
		western: ["Tops", "Tees", "Dresses", "Jumpsuits", "Jeans", "Sleepwear"],
		jewellery: ["Earrings", "Rings"],
	},
}

const products = Array.from({ length: 6 }).map((_, i) => ({
	id: i + 1,
	title: ["Floral Kurta", "Classic Saree", "Girls Dress", "Boys Tee", "Baby Romper", "Teens Jeans"][i % 6],
	price: ["₹799", "₹1,499", "₹699", "₹399", "₹499", "₹999"][i % 6],
	originalPrice: ["₹1,299", "₹2,499", "₹1,199", "₹699", "₹899", "₹1,799"][i % 6],
	image: `https://placehold.co/600x700?text=Product+${i + 1}`,
}))

export default function Home() {
	return (
		<div className="min-h-screen bg-white font-sans text-gray-900">
			{/* Light pink header with soft bottom curve */}
			<header
				className="relative bg-[#FCDDF3] text-[#1f1f1f] px-4 pt-3 pb-16 rounded-b-[28px]"
				style={{ boxShadow: "0 2px 0 rgba(0,0,0,0.02) inset" }}
			>
				<div className="flex items-center justify-between">
					<button aria-label="Menu" className="p-2">
						<AlignJustify className="h-6 w-6 text-[#1f1f1f]" />
					</button>
					<div className="flex items-center justify-center">
						<img
							src="/logo1.png"
							alt="JJ Textiles"
							className="h-10 w-auto mx-auto"
						/>
					</div>
					<div className="flex items-center gap-3">
						<button aria-label="Cart" className="p-2">
							<ShoppingCart className="h-6 w-6 text-[#1f1f1f]" />
						</button>
						<button aria-label="Account" className="p-2">
							<User className="h-6 w-6 text-[#1f1f1f]" />
						</button>
					</div>
				</div>
			</header>

			{/* Floating search bar overlapping header */}
			<div className="-mt-8 px-4">
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

			{/* Category rail */}
			<section className="mt-4 px-3">
				<div
					className="no-scrollbar flex gap-3 overflow-x-auto py-1"
					style={{ WebkitOverflowScrolling: "touch" }}
				>
					{topHighlights.map((item) => (
						<div key={item.title} className="flex w-[78px] flex-col items-center shrink-0">
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
						</div>
					))}
				</div>
			</section>

			{/* Hero banner */}
			<section className="mt-4 px-4">
				<div className="relative rounded-lg overflow-hidden">
					<img
						src="https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1200&auto=format&fit=crop"
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
