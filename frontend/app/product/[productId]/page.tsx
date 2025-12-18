import { Metadata } from "next"
import ProductPageClient from "./ProductPageClient"
import PageErrorBoundary from "@/components/page-error-boundary"

// SEO Metadata - This will be dynamic based on product
export const generateMetadata = async ({ params }: { params: Promise<{ productId: string }> }): Promise<Metadata> => {
  // Return static metadata to prevent server-side rendering errors
  return {
    title: "Product Details - JJTextiles",
    description: "Explore product details from JJTextiles.",
    openGraph: {
      title: "Product Details - JJTextiles",
      description: "Explore product details from JJTextiles.",
      images: ['/logo1.png'],
      type: 'website',
    },
    twitter: {
      title: "Product Details - JJTextiles",
      description: "Explore product details from JJTextiles.",
      images: ['/logo1.png'],
      card: 'summary_large_image',
    },
  }
}

export default function ProductPage({ params }: { params: { productId: string } }) {
  const { productId } = params;

  return (
    <PageErrorBoundary pageName="Product Page">
      <ProductPageClient productId={productId} />
    </PageErrorBoundary>
  );
}
