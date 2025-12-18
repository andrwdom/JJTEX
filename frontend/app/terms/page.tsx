import { Metadata } from 'next'
import TermsPageClient from './TermsPageClient'

// SEO Metadata for terms page
export const metadata: Metadata = {
  title: "Terms and Conditions - JJTextiles",
  description: "Read the Terms and Conditions for using JJTextiles' website and services. Learn about our policies, shipping, returns, and more.",
  keywords: [
    "terms and conditions",
    "JJTextiles terms",
    "website terms",
    "shipping policy",
    "return policy"
  ],
  openGraph: {
    title: "Terms and Conditions - JJTextiles",
    description: "Read the Terms and Conditions for using JJTextiles' website and services.",
    images: ['/logo1.png'],
  },
  twitter: {
    title: "Terms and Conditions - JJTextiles",
    description: "Read the Terms and Conditions for using JJTextiles' website and services.",
  },
}

export default function TermsPage() {
  return <TermsPageClient />
}
