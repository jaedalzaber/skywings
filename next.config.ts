import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
      {
        pathname: '/images/**',
      },
      {
        // Media mirrored out of Cloudinary by `pnpm run mirror:media`.
        pathname: '/media/**',
      },
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  // The Cloudinary adapter serves brochures and 3D assets from these committed
  // upload folders before falling back to the CDN, so the file route needs
  // them in its serverless bundle.
  outputFileTracingIncludes: {
    '/api/**': ['./brochures/**', './three-d-assets/**'],
  },
  // The blog became the Resources hub; old links and bookmarks follow it there.
  async redirects() {
    return [
      { source: '/blog', destination: '/resources', permanent: true },
      { source: '/blog/:slug', destination: '/resources/:slug', permanent: true },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
