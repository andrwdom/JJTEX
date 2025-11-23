import { Metadata } from "next"
import ProductPageClient from "./ProductPageClient"
import PageErrorBoundary from "@/components/page-error-boundary"

// SEO Metadata - This will be dynamic based on product
export const generateMetadata = async ({ 
  params 
}: { 
  params: Promise<{ categoryName: string; productId: string }> 
}): Promise<Metadata> => {
  const { categoryName, productId } = await params
  
  // Format category name for display
  const formattedCategoryName = categoryName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  return {
    title: `Product - ${formattedCategoryName} | JJ Textiles`,
    description: `Shop premium ${formattedCategoryName.toLowerCase()} products at JJ Textiles. Quality fashion for your wardrobe.`,
    openGraph: {
      title: `Product - ${formattedCategoryName} | JJ Textiles`,
      description: `Shop premium ${formattedCategoryName.toLowerCase()} products at JJ Textiles.`,
      images: ['/logo1.png'],
      type: 'website',
      url: `https://jjtextiles.com/${categoryName}/product/${productId}`,
    },
    twitter: {
      title: `Product - ${formattedCategoryName} | JJ Textiles`,
      description: `Shop premium ${formattedCategoryName.toLowerCase()} products at JJ Textiles.`,
      images: ['/logo1.png'],
      card: 'summary_large_image',
    },
  }
}

export default function ProductPage({ 
  params 
}: { 
  params: Promise<{ categoryName: string; productId: string }> 
}) {
  return (
    <PageErrorBoundary pageName="Product Page">
      <ProductPageClientWrapper params={params} />
    </PageErrorBoundary>
  )
}

// Client component wrapper to handle async params
async function ProductPageClientWrapper({ 
  params 
}: { 
  params: Promise<{ categoryName: string; productId: string }> 
}) {
  const { productId } = await params
  return <ProductPageClient productId={productId} />
}

