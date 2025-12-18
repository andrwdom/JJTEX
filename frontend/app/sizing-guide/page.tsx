import { Metadata } from "next"
import SizingGuideClient from "./SizingGuideClient"

export const metadata: Metadata = {
  title: "Size Guide - JJTextiles | Find Your Perfect Fit",
  description: "Find your perfect fit with our size guide. Get accurate measurements and sizing charts for a better shopping experience.",
  keywords: [
    "size guide",
    "size chart",
    "measurements",
    "jjtextiles sizing"
  ],
  openGraph: {
    title: "Size Guide - JJTextiles | Find Your Perfect Fit",
    description: "Find your perfect fit with our size guide and sizing charts.",
    images: ['/logo1.png'],
    type: 'website',
    url: 'https://jjtextiles.com/sizing-guide',
    siteName: 'JJTextiles',
  },
  twitter: {
    title: "Size Guide - JJTextiles | Find Your Perfect Fit",
    description: "Find your perfect fit with our size guide and sizing charts.",
    card: 'summary_large_image',
    images: ['/logo1.png'],
  },
}

export default function SizingGuidePage() {
  return <SizingGuideClient />
} 