"use client"

import React, { useState } from "react"
import { AlignJustify, ShoppingCart, User, Search as SearchIcon } from "lucide-react"
import MobileMenuSidebar from "@/components/mobile-menu-sidebar"
import { useCart } from "@/components/cart-context"
import { useAuth } from "@/components/auth/useAuth"
import LoginModal from "@/components/auth/LoginModal"

type SiteHeaderProps = {
  /**
   * If you want to control the search input from a page, pass value/onChange.
   * Otherwise it will be uncontrolled and purely visual (like on the current home page).
   */
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  showSearch?: boolean
}

export default function SiteHeader({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search for brands and products",
  showSearch = true,
}: SiteHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const { openCartSidebar, cartItems } = useCart()
  const { user } = useAuth()

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)

  const handleAccountClick = () => {
    if (user) {
      window.location.href = "/account"
    } else {
      setIsLoginModalOpen(true)
    }
  }

  return (
    <>
      {/* Light pink header with soft bottom curve (Home-style) */}
      <header
        className="relative bg-[#FCDDF3] text-[#1f1f1f] px-4 pt-3 pb-4 rounded-b-[28px]"
        style={{ boxShadow: "0 2px 0 rgba(0,0,0,0.02) inset" }}
      >
        <div className="flex items-center justify-between mb-4">
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
          <div className="px-0 pb-2">
            <div className="relative">
              <div className="flex items-center gap-2 bg-white rounded-full shadow-lg px-4 py-3">
                <SearchIcon className="h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                  aria-label="Search"
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
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


