import { Metadata } from 'next'
import PrivacyPolicyPageClient from './PrivacyPolicyPageClient'

// SEO Metadata for privacy policy page
export const metadata: Metadata = {
  title: "Privacy Policy - JJTextiles",
  description: "Read the Privacy Policy for JJTextiles. Learn how we collect, use, and protect your personal information when you visit or make a purchase.",
  keywords: [
    "privacy policy",
    "data protection",
    "customer privacy",
    "JJTextiles privacy",
    "personal information",
    "online shopping privacy"
  ],
  openGraph: {
    title: "Privacy Policy - JJTextiles",
    description: "Read the Privacy Policy for JJTextiles. Learn how we collect, use, and protect your personal information.",
    images: ['/logo1.png'],
  },
  twitter: {
    title: "Privacy Policy - JJTextiles",
    description: "Read the Privacy Policy for JJTextiles. Learn how we collect, use, and protect your personal information.",
  },
}

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyPageClient />
}