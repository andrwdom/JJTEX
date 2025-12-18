import { Metadata } from 'next'
import CheckoutPageClient from './CheckoutPageClient'

// SEO Metadata for checkout page
export const metadata: Metadata = {
  title: "Checkout - JJTextiles",
  description: "Complete your order at JJTextiles. Secure checkout with multiple payment options.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function CheckoutPage() {
  return <CheckoutPageClient />
} 