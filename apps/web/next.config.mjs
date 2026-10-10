/** @type {import('next').NextConfig} */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Standalone-сборка для Docker
  output: 'standalone',

  // Пакеты монорепо компилируются из исходников
  transpilePackages: ['@kinoox/design-system', '@kinoox/api-client'],

  experimental: {
    // ISR и кэш страниц: снижает нагрузку на SSR
    optimizePackageImports: ['@kinoox/design-system', 'framer-motion'],
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'st.kp.yandex.net' },
      { protocol: 'https', hostname: 'avatars.mds.yandex.net' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'kinoox.ru' },
      { protocol: 'https', hostname: 'old.mvapspdmpg.com' },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      {
        source: '/screenshots/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, immutable' }],
      },
      {
        source: '/brand/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, immutable' }],
      },
    ]
  },

  async redirects() {
    return [
      // www → без www, 301
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.kinoox.ru' }],
        destination: 'https://kinoox.ru/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig