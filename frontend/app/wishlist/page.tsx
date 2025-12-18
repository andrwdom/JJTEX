import { Metadata } from "next"
import WishlistPageClient from "./WishlistPageClient"

export const metadata: Metadata = {
  title: "Wishlist - JJTextiles | Save Your Favorites",
  description: "Save your favorite items to your wishlist and build your JJTextiles collection.",
  keywords: [
    "wishlist",
    "favorites",
    "jjtextiles",
    "save items",
    "shopping"
  ],
  openGraph: {
    title: "Wishlist - JJTextiles | Save Your Favorites",
    description: "Save your favorite items to your wishlist and build your JJTextiles collection.",
    images: ['/logo1.png'],
    type: 'website',
    url: 'https://jjtextiles.com/wishlist',
    siteName: 'JJTextiles',
  },
  twitter: {
    title: "Wishlist - JJTextiles | Save Your Favorites",
    description: "Save your favorite items to your wishlist and build your JJTextiles collection.",
    card: 'summary_large_image',
    images: ['/logo1.png'],
  },
}

export default function WishlistPage() {
  return <WishlistPageClient />
} 