"use client"

import React, { useEffect, useMemo, useState } from "react"
import { AlignJustify, ShoppingCart, User, Search as SearchIcon } from "lucide-react"
import MobileMenuSidebar from "@/components/mobile-menu-sidebar"
import { useCart } from "@/components/cart-context"
import { useAuth } from "@/components/auth/useAuth"
import LoginModal from "@/components/auth/LoginModal"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

type SiteHeaderProps = {
  /**
   * If you want to control the search input from a page, pass value/onChange.
   * Otherwise it will be uncontrolled and purely visual (like on the current home page).
   */
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  showSearch?: boolean
  /**
   * Seamless mode for pages where the header should visually blend into the next section (e.g. category pages).
   * Removes rounded bottom + any header shadow so the background color flows into the hero below.
   */
  seamless?: boolean
  /**
   * If true, the header becomes sticky and stays visible while scrolling.
   */
  sticky?: boolean
  /**
   * If true, the header transitions into a subtle glass look after scrolling a bit.
   */
  glassOnScroll?: boolean
  /**
   * If true (and search isn't controlled via props), sync the search input to the URL query param (default `q`).
   * This lets pages like collections read `?q=` and filter without rendering a second search bar.
   */
  syncSearchToUrl?: boolean
  searchParamKey?: string
}

export default function SiteHeader({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search for brands and products",
  showSearch = true,
  seamless = false,
  sticky = false,
  glassOnScroll = false,
  syncSearchToUrl = false,
  searchParamKey = "q",
}: SiteHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const { openCartSidebar, cartItems } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isScrolled, setIsScrolled] = useState(false)

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const urlSearchValue = useMemo(() => (searchParams?.get(searchParamKey) || "").toString(), [searchParams, searchParamKey])

  const [internalSearch, setInternalSearch] = useState("")
  const effectiveSearchValue = typeof searchValue === "string" ? searchValue : (syncSearchToUrl ? urlSearchValue : internalSearch)

  useEffect(() => {
    if (typeof searchValue === "string") return
    if (!syncSearchToUrl) return
    setInternalSearch(urlSearchValue)
  }, [searchValue, syncSearchToUrl, urlSearchValue])

  useEffect(() => {
    if (!glassOnScroll) return

    const onScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [glassOnScroll])

  const handleAccountClick = () => {
    if (user) {
      window.location.href = "/account"
    } else {
      setIsLoginModalOpen(true)
    }
  }

  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value)
      return
    }

    setInternalSearch(value)

    if (!syncSearchToUrl) return

    const params = new URLSearchParams(searchParams?.toString() || "")
    const trimmed = value.trim()

    if (trimmed) params.set(searchParamKey, trimmed)
    else params.delete(searchParamKey)

    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : `${pathname}`, { scroll: false })
  }

  return (
    <>
      {/* Light pink header with soft bottom curve (Home-style) */}
      <header
        className={[
          "relative text-[#1f1f1f] px-4 pt-3 transition-all duration-300 ease-in-out",
          sticky ? "sticky top-0 z-[9999]" : "",
          // Background + shape
          seamless ? "pb-2 rounded-b-none" : "pb-4 rounded-b-[28px]",
          // Color blending
          glassOnScroll && isScrolled
            ? "bg-[#fce4ec]/70 backdrop-blur-md"
            : (seamless ? "bg-[#fce4ec]" : "bg-[#FCDDF3]"),
        ].join(" ")}
        style={seamless ? undefined : { boxShadow: "0 2px 0 rgba(0,0,0,0.02) inset" }}
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className={["flex items-center justify-between", seamless ? "mb-3" : "mb-4"].join(" ")}>
            <button
              aria-label="Menu"
              className="p-2 hover:bg-white/30 rounded-lg transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(true)}
              type="button"
            >
              <AlignJustify className="h-6 w-6 text-[#1f1f1f]" />
            </button>

            <div className="flex items-center justify-center">
              <button onClick={() => (window.location.href = "/")} className="cursor-pointer" type="button">
                <img src="/logo1.png" alt="JJ Textiles" className="h-10 w-auto mx-auto" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                aria-label="Cart"
                className="p-2 hover:bg-white/30 rounded-lg transition-colors duration-200 relative"
                onClick={openCartSidebar}
                type="button"
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
                type="button"
              >
                <User className="h-6 w-6 text-[#1f1f1f]" />
              </button>
            </div>
          </div>

          {/* Search bar inside pink header */}
          {showSearch && (
            <div className={["px-0", seamless ? "pb-1" : "pb-2"].join(" ")}>
              <div className="relative max-w-2xl mx-auto">
                <div className={["flex items-center gap-2 bg-white rounded-full px-4 py-3", seamless ? "shadow-md" : "shadow-lg"].join(" ")}>
                  <SearchIcon className="h-5 w-5 text-gray-500" />
                  <input
                    id="site-header-search"
                    type="text"
                    placeholder={searchPlaceholder}
                    className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                    aria-label="Search"
                    value={effectiveSearchValue}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Menu Sidebar */}
      <MobileMenuSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Login Modal */}
      <LoginModal
        open={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => setIsLoginModalOpen(false)}
      />
    </>
  )
}


