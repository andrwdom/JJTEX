import { Metadata } from "next"
import CategoryPageClient from "./CategoryPageClient"
import Script from "next/script"

// SEO Metadata - This will be dynamic based on category
export const generateMetadata = async ({ params }: { params: Promise<{ categorySlug: string }> }): Promise<Metadata> => {
  const { categorySlug } = await params
  const categoryName = categorySlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  const siteName = "JJ Textiles"
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jjtextiles.com"

  // Keep metadata generic (this project was migrated from a different site)
  const title = `${categoryName} Collection | ${siteName}`
  const description = `Shop ${categoryName} at ${siteName}. Browse the latest products in this category.`

  return {
    title: title,
    description: description,
    keywords: [
      categoryName.toLowerCase(),
      "jj textiles",
      "online shopping",
      "fashion",
      "clothing",
      "collections"
    ],
    openGraph: {
      title: title,
      description: description,
      images: ['/logo1.png'],
      type: 'website',
      url: `${siteUrl}/collections/${categorySlug}`,
    },
    twitter: {
      title: title,
      description: description,
      images: ['/logo1.png'],
      card: 'summary_large_image',
    },
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = await params
  
  // Format category name for display
  const categoryName = categorySlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jjtextiles.com"
  
  return (
    <>
      {/* Add BreadcrumbList structured data */}
      <Script
        id={`breadcrumb-schema-${categorySlug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": siteUrl
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": categoryName,
                "item": `${siteUrl}/collections/${categorySlug}`
              }
            ]
          })
        }}
      />
      
      {/* Add CollectionPage structured data */}
      <Script
        id={`collection-schema-${categorySlug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": `${categoryName} Collection - JJ Textiles`,
            "description": `Browse products in ${categoryName}.`,
            "url": `${siteUrl}/collections/${categorySlug}`,
            "mainEntity": {
              "@type": "ItemList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "url": `${siteUrl}/collections/${categorySlug}`
                }
              ]
            }
          })
        }}
      />
      
      <CategoryPageClient categorySlug={categorySlug} />
    </>
  )
}
