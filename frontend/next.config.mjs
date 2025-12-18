/** @type {import('next').NextConfig} */
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: false, // Enable image optimization
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jjtextiles.com',
        port: '',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'jjtextiles.com',
        port: '',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/images/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/uploads/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Cloudflare optimization settings
    loader: 'custom',
    loaderFile: './lib/image-loader.js',
  },
  serverExternalPackages: ['sharp', 'mongodb'], // Moved from experimental
  experimental: {
    optimizeCss: false, // Temporarily disable to fix critters dependency issue
    optimizePackageImports: [
      '@radix-ui/react-icons',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-label',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-accordion',
      '@radix-ui/react-popover',
      '@radix-ui/react-toast',
      'lucide-react',
      'framer-motion'
    ],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true, // Enable ETags for better cache invalidation
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Enable static optimization
  trailingSlash: false,
  // Removed assetPrefix to prevent CORS issues - assets should be served from same domain
  // assetPrefix should only be used for CDN scenarios, not same-domain serving
  // Optimize bundle size
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Aggressive code splitting for mobile performance
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Split large UI libraries
          radixUI: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'radix-ui',
            priority: 10,
            reuseExistingChunk: true,
          },
          // Split Framer Motion (animation library)
          framerMotion: {
            test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            name: 'framer-motion',
            priority: 10,
            reuseExistingChunk: true,
          },
          // Split Firebase (auth library)
          firebase: {
            test: /[\\/]node_modules[\\/]firebase[\\/]/,
            name: 'firebase',
            priority: 10,
            reuseExistingChunk: true,
          },
          // Common vendor libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            priority: 5,
            reuseExistingChunk: true,
          },
          // Common code across pages
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };
      
      // Tree shaking for production
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false; // Enable aggressive tree shaking
      
      // Mobile-specific optimizations
      config.optimization.splitChunks.maxSize = 244000; // ~240KB max chunk size for mobile
      config.optimization.splitChunks.minSize = 20000; // 20KB min chunk size
      
      // More aggressive compression
      if (process.env.NODE_ENV === 'production') {
        config.optimization.minimize = true;
      }
    }
    return config;
  },
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // 🔥 CRITICAL: ZERO cache for HTML pages = INSTANT updates
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // 🚀 CRITICAL: Long cache for versioned static assets (build ID ensures freshness)
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1 year - safe because build ID changes
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      // 🚀 API responses - never cache
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
        ],
      },
    ]
  },
  // Dev-only: proxy same-origin /api/* calls to the backend server to avoid browser blockers
  // and to keep client requests same-origin in local development.
  rewrites: async () => {
    if (process.env.NODE_ENV !== 'development') return []

    const backend = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    const backendOrigin = backend.replace(/\/$/, '')

    return [
      {
        source: '/api/:path*',
        destination: `${backendOrigin}/api/:path*`,
      },
    ]
  },
}

// Wrap with Sentry configuration (non-intrusive)
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry webpack plugin
  silent: true, // Suppresses source map uploading logs during build
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Only upload source maps in production
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
