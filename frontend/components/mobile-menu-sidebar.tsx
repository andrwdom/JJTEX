"use client"

import React, { useState, useEffect } from "react"
import { X, Home, List, Info, Mail, LogIn, LogOut, User, ChevronDown, ChevronRight } from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useAuth } from "@/components/auth/useAuth"
import LoginModal from "@/components/auth/LoginModal"
import { useRouter } from "next/navigation"
import { fetchCategoryTree, CategoryTree } from "@/lib/category-utils"

interface MobileMenuSidebarProps {
	isOpen: boolean
	onClose: () => void
	onCategoriesClick?: () => void
}

export default function MobileMenuSidebar({
	isOpen,
	onClose,
}: MobileMenuSidebarProps) {
	const { user, logout } = useAuth()
	const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
	const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
	const [openMainGroups, setOpenMainGroups] = useState<Record<string, boolean>>({})
	const [openSubGroups, setOpenSubGroups] = useState<Record<string, boolean>>({})
	const [categoryTree, setCategoryTree] = useState<CategoryTree[]>([])
	const [categoriesLoading, setCategoriesLoading] = useState(true)
	const router = useRouter()

	// Fetch categories from backend
	useEffect(() => {
		async function loadCategories() {
			setCategoriesLoading(true)
			try {
				const tree = await fetchCategoryTree()
				setCategoryTree(tree)
			} catch (error) {
				console.error('Failed to load categories:', error)
			} finally {
				setCategoriesLoading(false)
			}
		}
		loadCategories()
	}, [])

	const handleLogout = () => {
		logout()
		onClose()
	}

	const handleSignInClick = () => {
		setIsLoginModalOpen(true)
		onClose()
	}

	const handleAccountClick = () => {
		router.push("/account")
		onClose()
	}

	const handleNavigation = (path: string) => {
		router.push(path)
		onClose()
	}

	const handleCategoryClick = (categorySlug: string) => {
		// Use the actual slug from backend
		router.push(`/collections/${categorySlug}`)
		onClose()
	}

	const toggleMainGroup = (group: string) => {
		setOpenMainGroups(prev => ({
			...prev,
			[group]: !prev[group]
		}))
	}

	const toggleSubGroup = (key: string) => {
		setOpenSubGroups(prev => ({
			...prev,
			[key]: !prev[key]
		}))
	}

	const menuItems = [
		{
			icon: Home,
			label: "Home",
			onClick: () => handleNavigation("/"),
		},
		{
			icon: Info,
			label: "About Us",
			onClick: () => handleNavigation("/about"),
		},
		{
			icon: Mail,
			label: "Contact Us",
			onClick: () => handleNavigation("/contact"),
		},
	]

	return (
		<>
			<Sheet open={isOpen} onOpenChange={onClose}>
				<SheetContent
					side="left"
					className="w-[320px] sm:w-[360px] bg-white p-0 h-full flex flex-col overflow-hidden [&>button]:hidden"
				>
					{/* Header - Pink background spanning full width */}
					<div className="bg-[#FCDDF3] px-6 py-4 border-b border-pink-200/50 flex items-center justify-between flex-shrink-0">
						<div className="flex items-center gap-3">
							<img
								src="/logo1.png"
								alt="JJ Textiles"
								className="h-8 w-auto"
							/>
							<h2 className="text-xl font-bold text-[#1f1f1f]">Menu</h2>
						</div>
						<button
							onClick={onClose}
							className="p-2 hover:bg-white/50 rounded-lg transition-colors duration-200"
							aria-label="Close menu"
						>
							<X className="h-5 w-5 text-[#1f1f1f]" />
						</button>
					</div>

					{/* Scrollable Content */}
					<div className="flex-1 overflow-y-auto">
						<div className="py-2">
							{/* Navigation Items */}
							{menuItems.map((item) => {
								const Icon = item.icon
								return (
									<button
										key={item.label}
										onClick={item.onClick}
										className="w-full flex items-center gap-4 px-6 py-3.5 text-left hover:bg-pink-50 transition-colors duration-200 group"
									>
										<Icon className="h-5 w-5 text-gray-700 group-hover:text-pink-600 transition-colors" />
										<span className="font-medium text-gray-900 group-hover:text-pink-600 transition-colors">
											{item.label}
										</span>
									</button>
								)
							})}

							{/* Categories - Expandable Accordion */}
							<Collapsible
								open={isCategoriesOpen}
								onOpenChange={setIsCategoriesOpen}
							>
								<CollapsibleTrigger asChild>
									<button className="w-full flex items-center justify-between px-6 py-3.5 text-left hover:bg-pink-50 transition-colors duration-200 group">
										<div className="flex items-center gap-4">
											<List className="h-5 w-5 text-gray-700 group-hover:text-pink-600 transition-colors" />
											<span className="font-medium text-gray-900 group-hover:text-pink-600 transition-colors">
												Categories
											</span>
										</div>
										<ChevronDown
											className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
												isCategoriesOpen ? "rotate-180" : ""
											}`}
										/>
									</button>
								</CollapsibleTrigger>

								<CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
									<div className="bg-gray-50/50 pb-2">
										{categoriesLoading ? (
											<div className="px-6 py-4 text-sm text-gray-500">Loading categories...</div>
										) : categoryTree.length === 0 ? (
											<div className="px-6 py-4 text-sm text-gray-500">No categories available</div>
										) : (
											categoryTree.map((rootCategory) => {
												const mainGroupKey = rootCategory.slug
												const isMainOpen = openMainGroups[mainGroupKey] || false

												return (
													<Collapsible
														key={rootCategory._id}
														open={isMainOpen}
														onOpenChange={() => toggleMainGroup(mainGroupKey)}
													>
														<CollapsibleTrigger asChild>
															<button className="w-full flex items-center justify-between px-6 pl-14 py-2.5 text-left hover:bg-pink-100/50 transition-colors duration-200">
																<span className="font-semibold text-gray-900">{rootCategory.name}</span>
																<ChevronDown
																	className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
																		isMainOpen ? "rotate-180" : ""
																	}`}
																/>
															</button>
														</CollapsibleTrigger>
														<CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
															{rootCategory.children && rootCategory.children.length > 0 ? (
																rootCategory.children.map((subCategory) => {
																	const subGroupKey = `${mainGroupKey}-${subCategory.slug}`
																	const isSubOpen = openSubGroups[subGroupKey] || false

																	return (
																		<div key={subCategory._id}>
																			{subCategory.children && subCategory.children.length > 0 ? (
																				<Collapsible
																					open={isSubOpen}
																					onOpenChange={() => toggleSubGroup(subGroupKey)}
																				>
																					<CollapsibleTrigger asChild>
																						<button className="w-full flex items-center justify-between px-6 pl-20 py-2 text-left hover:bg-pink-100/30 transition-colors duration-200">
																							<span className="text-sm font-medium text-gray-800">{subCategory.name}</span>
																							<ChevronDown
																								className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
																									isSubOpen ? "rotate-180" : ""
																								}`}
																							/>
																						</button>
																					</CollapsibleTrigger>
																					<CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
																						{subCategory.children.map((leafCategory) => (
																							<button
																								key={leafCategory._id}
																								onClick={() => handleCategoryClick(leafCategory.slug)}
																								className="w-full px-6 pl-24 py-2 text-left text-sm text-gray-700 hover:bg-pink-100/40 hover:text-pink-600 transition-colors duration-200"
																							>
																								{leafCategory.name}
																							</button>
																						))}
																					</CollapsibleContent>
																				</Collapsible>
																			) : (
																				// If no children, make it clickable directly
																				<button
																					onClick={() => handleCategoryClick(subCategory.slug)}
																					className="w-full px-6 pl-20 py-2 text-left text-sm font-medium text-gray-800 hover:bg-pink-100/40 hover:text-pink-600 transition-colors duration-200"
																				>
																					{subCategory.name}
																				</button>
																			)}
																		</div>
																	)
																})
															) : (
																// If root category has no children but is a leaf, make it clickable
																rootCategory.isLeaf && (
																	<button
																		onClick={() => handleCategoryClick(rootCategory.slug)}
																		className="w-full px-6 pl-20 py-2 text-left text-sm font-medium text-gray-800 hover:bg-pink-100/40 hover:text-pink-600 transition-colors duration-200"
																	>
																		{rootCategory.name}
																	</button>
																)
															)}
														</CollapsibleContent>
													</Collapsible>
												)
											})
										)}
									</div>
								</CollapsibleContent>
							</Collapsible>
						</div>
					</div>

					{/* Footer - Pinned to bottom */}
					<div className="border-t border-gray-200 bg-white flex-shrink-0 pt-4 pb-6 px-6">
						{user ? (
							<>
								{/* User Info */}
								<div className="mb-4 pb-4 border-b border-gray-200">
									<div className="flex items-center gap-3 mb-3">
										<div className="p-2 rounded-full bg-pink-100">
											<User className="h-4 w-4 text-pink-600" />
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-semibold text-gray-900 truncate">
												{user.displayName || user.email?.split("@")[0] || "User"}
											</p>
											<p className="text-xs text-gray-600 truncate">
												{user.email}
											</p>
										</div>
									</div>
								</div>

								{/* Account Button */}
								<button
									onClick={handleAccountClick}
									className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white border border-gray-200 hover:bg-pink-50 hover:border-pink-200 transition-all duration-200 mb-2"
								>
									<User className="h-5 w-5 text-pink-600" />
									<span className="font-medium text-gray-900">Account</span>
								</button>

								{/* Sign Out Button */}
								<button
									onClick={handleLogout}
									className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 transition-all duration-200"
								>
									<LogOut className="h-5 w-5 text-red-600" />
									<span className="font-medium text-red-700">Sign Out</span>
								</button>
							</>
						) : (
							<button
								onClick={handleSignInClick}
								className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-pink-600 hover:bg-pink-700 text-white transition-colors duration-200"
							>
								<LogIn className="h-5 w-5" />
								<span className="font-medium">Sign In</span>
							</button>
						)}
					</div>
				</SheetContent>
			</Sheet>

			{/* Login Modal */}
			<LoginModal
				open={isLoginModalOpen}
				onClose={() => setIsLoginModalOpen(false)}
				onSuccess={() => {
					setIsLoginModalOpen(false)
				}}
			/>
		</>
	)
}
