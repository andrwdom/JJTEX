import type React from "react"
import type { Metadata } from "next"
import { Playfair_Display, Inter } from "next/font/google"
import "./globals.css"
import Providers from "./providers"
import CartSidebar from "@/components/cart-sidebar"
import LayoutClient from "@/components/layout-client"
import ErrorBoundary from "@/components/error-boundary"
import ServerErrorBoundary from "@/components/server-error-boundary"
import MobilePerformanceOptimizer from "@/components/mobile-performance-optimizer"
import InstagramOptimizations from "@/components/instagram-optimizations"
import Script from "next/script";
import PerformanceMonitor from "@/components/performance-monitor"
import OfflineIndicator from "@/components/offline-indicator"

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "JJTextiles - Premium Apparel & Textiles",
    template: "%s | JJTextiles"
  },
  description: "Discover premium apparel and textiles at JJTextiles. Curated collections, great comfort, and reliable service.",
  keywords: [
    "jjtextiles",
    "apparel",
    "textiles",
    "clothing",
    "fashion",
    "online shopping",
    "india"
  ],
  authors: [{ name: "JJTextiles" }],
  creator: "JJTextiles",
  publisher: "JJTextiles",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    (process.env.NEXT_PUBLIC_SITE_URL) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://jjtextiles.com')
  ),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: 'JJTextiles',
    title: 'JJTextiles - Premium Apparel & Textiles',
    description: 'Discover premium apparel and textiles at JJTextiles. Curated collections, great comfort, and reliable service.',
    images: [
      {
        url: '/logo1.png',
        width: 1200,
        height: 630,
        alt: 'JJTextiles - Premium Apparel & Textiles',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JJTextiles - Premium Apparel & Textiles',
    description: 'Discover premium apparel and textiles at JJTextiles.',
    images: ['/logo1.png'],
    creator: '@jjtextiles',
    site: '@jjtextiles',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  category: 'fashion',
  classification: 'Apparel & Textiles Store',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Add development mode error logging
  if (process.env.NODE_ENV === 'development') {
    console.log('Layout rendering with API URL:', process.env.NEXT_PUBLIC_API_URL);
  }

  return (
    <html lang="en" className={`${playfairDisplay.variable} ${inter.variable}`}>
      <head>
        {/* Favicon Setup */}
        <link rel="icon" href="/logo1.png" type="image/png" />
        <link rel="shortcut icon" href="/logo1.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo1.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#473C66" />
        <meta name="msapplication-TileColor" content="#473C66" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Preload critical images */}
        <link rel="preload" as="image" href="/logo1.png" type="image/png" fetchpriority="high" />
        
        {/* WebP preloads will be added after running the optimization script */}
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "JJTextiles",
              "url": "https://jjtextiles.com",
              "logo": "https://jjtextiles.com/logo1.png",
              "description": "Premium apparel and textiles",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "IN"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "email": "info.jjtextiles@gmail.com"
              },
              "sameAs": [],
              "foundingDate": "2023",
              "industry": "Fashion & Apparel",
              "numberOfEmployees": "10-50"
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "JJTextiles",
              "url": "https://jjtextiles.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://jjtextiles.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "description": "Shop premium apparel and textiles at JJTextiles."
            })
          }}
        />
        
        {/* Fashion Brand Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Brand",
              "name": "JJTextiles",
              "description": "Premium apparel and textiles",
              "url": "https://jjtextiles.com",
              "logo": "https://jjtextiles.com/logo1.png",
              "category": "Fashion & Apparel",
              "slogan": "Premium Apparel & Textiles",
              "knowsAbout": [
                "Apparel",
                "Textiles",
                "Fashion"
              ]
            })
          }}
        />
        
        {/* Cart restoration is now handled by CartProvider context - removed inline script to prevent conflicts */}
      </head>
      <body className="font-body min-h-screen flex flex-col">
        <PerformanceMonitor />
        <OfflineIndicator />
        <ServerErrorBoundary>
          <ErrorBoundary>
            <Providers>
              <MobilePerformanceOptimizer>
                <InstagramOptimizations />
                <LayoutClient>{children}</LayoutClient>
                <CartSidebar />
              </MobilePerformanceOptimizer>
            </Providers>
          </ErrorBoundary>
        </ServerErrorBoundary>
      </body>
    </html>
  )
}
