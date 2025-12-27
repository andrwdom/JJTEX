"use client"

import Link from "next/link"
import { Instagram, Mail, ShieldCheck, RotateCcw, Truck, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import { fetchCategoryTree, withTotalProductCounts, getCategoryHref, type CategoryTree } from "@/lib/category-utils"

const SUPPORT_EMAIL = "info.jjtextiles@gmail.com"
const INSTAGRAM_URL = "https://www.instagram.com/jjtextiles"

type FooterCategoryLink = { label: string; href: string }

const fallbackCategoryLinks: FooterCategoryLink[] = [
  { label: "Shop New Arrivals", href: "/" },
  { label: "Browse Categories", href: "/" },
]

const helpLinks = [
  { label: "Contact", href: "/contact" },
  { label: "Shipping Info", href: "/shipping-info" },
  { label: "Return Policy", href: "/return-policy" },
  { label: "Size Guide", href: "/sizing-guide" },
]

const legalLinks = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy-policy" },
]

export default function Footer() {
  const [categoryLinks, setCategoryLinks] = useState<FooterCategoryLink[]>(fallbackCategoryLinks)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const rawTree = await fetchCategoryTree(false)
        const tree = withTotalProductCounts(rawTree)

        type Leaf = { name: string; slug: string; path: string; total: number }
        const leaves: Leaf[] = []
        const walk = (nodes: CategoryTree[]) => {
          for (const n of nodes) {
            const children = n.children || []
            const isLeaf = !!n.isLeaf || children.length === 0
            const total = Number((n as any).totalProductCount || n.productCount || 0)
            if (isLeaf) leaves.push({ name: n.name, slug: n.slug, path: n.path, total })
            else walk(children)
          }
        }
        walk(tree)

        const popular = leaves
          .filter((l) => l.total > 0 && (l.path || l.slug))
          .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
          .slice(0, 6)
          .map((c) => ({ label: c.name, href: getCategoryHref({ path: c.path, slug: c.slug }) }))

        if (mounted && popular.length) setCategoryLinks(popular)
      } catch {
        // keep fallback
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <footer className="mt-10 border-t border-black/10 bg-gradient-to-b from-white to-[#fce4ec]/35">
      {/* Trust row */}
      <div className="px-4 sm:px-6 pt-10">
        <div className="mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-pink-200/60 bg-white/80 backdrop-blur px-5 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="h-11 w-11 rounded-xl bg-gradient-to-br from-pink-500/15 to-purple-500/10 flex items-center justify-center">
                <Truck className="h-5 w-5 text-pink-600" />
              </span>
              <div>
                <p className="font-semibold text-[#3b2b52]">Fast Delivery</p>
                <p className="text-xs text-gray-600">Delivered in 3–4 working days</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-pink-200/60 bg-white/80 backdrop-blur px-5 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="h-11 w-11 rounded-xl bg-gradient-to-br from-pink-500/15 to-purple-500/10 flex items-center justify-center">
                <RotateCcw className="h-5 w-5 text-pink-600" />
              </span>
              <div>
                <p className="font-semibold text-[#3b2b52]">Easy Support</p>
                <p className="text-xs text-gray-600">Quick help via email & Instagram</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-pink-200/60 bg-white/80 backdrop-blur px-5 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="h-11 w-11 rounded-xl bg-gradient-to-br from-pink-500/15 to-purple-500/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-pink-600" />
              </span>
              <div>
                <p className="font-semibold text-[#3b2b52]">Secure Checkout</p>
                <p className="text-xs text-gray-600">Safe & trusted payments</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="px-4 sm:px-6 py-10">
        <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src="/logo1.png" alt="JJTextiles" className="h-9 w-9 rounded-lg border border-pink-200/70 bg-white" />
              <div>
                <p className="text-lg font-bold tracking-wide text-[#3b2b52]">JJTextiles</p>
                <p className="text-xs text-gray-600">Premium Apparel & Textiles</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Curated styles, elevated essentials, and a smooth shopping experience—crafted for everyday confidence.
            </p>
            <div className="flex items-center gap-3">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-flex items-center gap-2 rounded-full border border-pink-200/70 bg-white px-4 py-2 text-sm font-semibold text-[#3b2b52] shadow-sm hover:-translate-y-[1px] hover:shadow-md transition"
              >
                <Mail className="h-4 w-4 text-pink-600" />
                Email
                <ChevronRight className="h-4 w-4 text-pink-500" />
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-pink-200/70 bg-white p-2.5 text-[#3b2b52] shadow-sm hover:-translate-y-[1px] hover:shadow-md transition"
                aria-label="JJTextiles on Instagram"
              >
                <Instagram className="h-4 w-4 text-pink-600" />
              </a>
            </div>
            <p className="text-xs text-gray-500">Support: {SUPPORT_EMAIL}</p>
          </div>

          {/* Shop */}
          <div className="space-y-4">
            <p className="text-sm font-bold tracking-wide text-[#3b2b52]">Popular Categories</p>
            <ul className="space-y-2">
              {categoryLinks.map((c) => (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-[#3b2b52] transition"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-pink-400/80" />
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div className="space-y-4">
            <p className="text-sm font-bold tracking-wide text-[#3b2b52]">Help</p>
            <ul className="space-y-2">
              {helpLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-700 hover:text-[#3b2b52] transition">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <p className="text-sm font-bold tracking-wide text-[#3b2b52]">Legal</p>
            <ul className="space-y-2">
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-700 hover:text-[#3b2b52] transition">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full bg-[#3b2b52] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95 transition"
              >
                Browse the store
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl mt-10 border-t border-black/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} JJTextiles. All rights reserved.
          </p>
          <p className="text-xs text-gray-500">
            Payments secured • Fast support • Easy browsing
          </p>
        </div>
      </div>
    </footer>
  )
}
