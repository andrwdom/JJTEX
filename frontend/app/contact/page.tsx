import ContactSection from "@/components/contact-section"
import PageLoading from "@/components/page-loading"
import { Metadata } from "next"
import ContactPageClient from "./ContactPageClient"

// SEO Metadata
export const metadata: Metadata = {
  title: "Contact JJTextiles - Get in Touch",
  description: "Contact JJTextiles for any questions about our products and services. We're here to help.",
  keywords: [
    "contact jjtextiles",
    "customer service",
    "support",
    "contact information"
  ],
  openGraph: {
    title: "Contact JJTextiles - Get in Touch",
    description: "Contact JJTextiles for any questions about our products and services.",
    images: ['/logo1.png'],
    type: 'website',
    url: 'https://jjtextiles.com/contact',
    siteName: 'JJTextiles',
  },
  twitter: {
    title: "Contact JJTextiles - Get in Touch",
    description: "Contact JJTextiles for any questions about our products and services.",
    card: 'summary_large_image',
    images: ['/logo1.png'],
  },
}

export default function ContactPage() {
  return <ContactPageClient />
}
