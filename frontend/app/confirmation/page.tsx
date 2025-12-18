import { Metadata } from 'next';
import ConfirmationPageClient from './ConfirmationPageClient';

// SEO Metadata for confirmation page
export const metadata: Metadata = {
  title: "Order Confirmation - JJTextiles",
  description: "Your order has been confirmed. Thank you for choosing JJTextiles.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function ConfirmationPage() {
  return <ConfirmationPageClient />
}