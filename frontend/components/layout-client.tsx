"use client";
import { useState, useEffect } from "react";
import Footer from "@/components/footer";
import SiteHeader from "@/components/site-header";
import { usePathname } from "next/navigation";
import { useLoading } from "@/components/loading-context";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoading } = useLoading();

  // Hide navbar and footer during checkout for cleaner experience
  const isCheckoutPage = pathname?.startsWith('/checkout');
  // Hide legacy navbar/footer on the new mobile-first homepage
  const isHomePage = pathname === '/';
  const isCollectionsPage = pathname?.startsWith('/collections/');
  const isProductPage = pathname?.startsWith('/product/') || pathname?.includes('/product/');
  
  // Don't hide navbar during page loading - only hide during checkout
  const shouldShowNavbar = !isCheckoutPage && !isHomePage;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <>
      {/* Show navbar on all pages except checkout */}
      {shouldShowNavbar && (
        <>
          <SiteHeader
            seamless={isCollectionsPage || isProductPage}
            syncSearchToUrl={isCollectionsPage}
          />
        </>
      )}
      <main className="flex-1 flex flex-col">{children}</main>
      {/* Show footer on all pages except checkout */}
      {shouldShowNavbar && <Footer />}
    </>
  );
} 