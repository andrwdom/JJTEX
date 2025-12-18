import { Metadata } from "next"
import AccountPageClient from "./AccountPageClient"

// SEO Metadata for account page
export const metadata: Metadata = {
  title: "My Account - JJTextiles",
  description: "Manage your JJTextiles account, view order history, and update your profile information.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function AccountPage() {
  return <AccountPageClient />
}