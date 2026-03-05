"use client"

import Link from "next/link"
import { Instagram, Mail, ShieldCheck, RotateCcw, Truck, ChevronRight } from "lucide-react"

const SUPPORT_EMAIL = "info.jjtextiles@gmail.com"
const INSTAGRAM_URL = "https://www.instagram.com/jjtextiles"

const categoryLinks = [
  { label: "Dresses & Jumpsuits", slug: "dresses-jumpsuits" },
  { label: "Ethnic Wear", slug: "ethnic-wear" },
  { label: "Tops & Tees", slug: "tops-tees" },
  { label: "Skirts", slug: "skirts" },
  { label: "Jewellery", slug: "jewellery" },
  { label: "Kids", slug: "kids" },
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
            <div className="space-y-3">
              <img src="/logo1.png" alt="JJTextiles Logo" className="h-14 w-auto object-contain rounded-xl border border-pink-200/70 bg-white p-1 shadow-sm" />
              <p className="text-xs text-gray-600 font-medium tracking-wider uppercase">Premium Apparel & Textiles</p>
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
            <p className="text-sm font-bold tracking-wide text-[#3b2b52]">Shop</p>
            <ul className="space-y-2">
              {categoryLinks.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/collections/${c.slug}`}
                    className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-[#3b2b52] transition"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-pink-400/80" />
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 rounded-full bg-[#3b2b52] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95 transition mt-2"
            >
              Browse all collections
              <ChevronRight className="h-4 w-4" />
            </Link>
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
          </div>
        </div>

        {/* Payment method icons */}
        <div className="mx-auto max-w-6xl mt-8 border-t border-black/10 pt-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            {/* Visa */}
            <svg className="h-6 w-auto text-gray-400" viewBox="0 0 48 16" fill="currentColor"><path d="M19.2 1l-3 14h-3.6l3-14h3.6zm14.4 9.1l1.9-5.2 1.1 5.2h-3zm4 4.9h3.3L38 1h-3c-.7 0-1.3.4-1.5 1l-5.4 13h3.8l.7-2.1h4.6l.4 2.1zm-9.8-4.6c0-3.6-5-3.8-5-5.4 0-.5.5-1 1.5-1.1 1.5-.1 2.8.4 3.6.9l.6-3C28 1.4 26.8 1 25.4 1c-3.6 0-6.1 1.9-6.1 4.6 0 2 1.8 3.1 3.2 3.8 1.4.7 1.9 1.1 1.9 1.7 0 .9-1.1 1.3-2.2 1.4-1.8 0-2.9-.5-3.7-.9l-.7 3c.8.4 2.4.7 4 .7 3.8-.1 6.2-1.9 6.2-4.8zM16.3 1l-6 14H6.5L3.6 4c-.2-.7-.4-.9-.9-1.2C1.8 2.3.2 1.8-.1 1.7L0 1h6.2c.8 0 1.5.5 1.7 1.4l1.5 8.1L13 1h3.3z" /></svg>
            {/* Mastercard */}
            <svg className="h-6 w-auto text-gray-400" viewBox="0 0 32 20" fill="currentColor"><circle cx="12" cy="10" r="9" opacity="0.6" /><circle cx="20" cy="10" r="9" opacity="0.4" /></svg>
            {/* RuPay */}
            <span className="text-[10px] font-bold text-gray-400 border border-gray-300 rounded px-1.5 py-0.5 tracking-wide">RuPay</span>
            {/* UPI */}
            <span className="text-[10px] font-bold text-gray-400 border border-gray-300 rounded px-1.5 py-0.5 tracking-wide">UPI</span>
            {/* PhonePe / GPay */}
            <span className="text-[10px] font-bold text-gray-400 border border-gray-300 rounded px-1.5 py-0.5 tracking-wide">GPay</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} JJTextiles. All rights reserved.
            </p>
            <a
              href="https://www.instagram.com/andrewwdominic"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] text-gray-400 hover:text-gray-500 transition-colors"
            >
              site by @andrewwdominic
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
