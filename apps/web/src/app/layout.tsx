import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import { Providers } from '@/components/providers/Providers'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { siteConfig } from '@/lib/config'
import '@kinoox/design-system/tokens.css'
import '@/styles/globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — онлайн-кинотеатр нового поколения`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    'онлайн-кинотеатр',
    'фильмы',
    'сериалы',
    'мультфильмы',
    'аниме',
    'KINOOX',
    'смотреть онлайн',
  ],
  authors: [{ name: 'KINOOX', url: siteConfig.url }],
  creator: 'KINOOX',
  publisher: 'KINOOX',
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.slogan}`,
    description: siteConfig.description,
    images: [{ url: '/brand/og-image.png', width: 1200, height: 630, alt: 'KINOOX' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} — ${siteConfig.slogan}`,
    description: siteConfig.description,
    images: ['/brand/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/brand/favicon.ico', sizes: 'any' },
      { url: '/brand/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/brand/apple-icon.png', sizes: '180x180' }],
  },
  manifest: undefined,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export const viewport: Viewport = {
  themeColor: '#06070A',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* PWA-манифест не подключается: KINOOX — это сайт, а не PWA */}
      </head>
      <body className="min-h-screen bg-void font-body text-text-primary antialiased">
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[700] focus:rounded-full focus:bg-surface focus:px-5 focus:py-3"
          >
            Перейти к содержимому
          </a>
          <SiteHeader />
          <main id="main" className="min-h-[60vh] pt-[72px]">
            {children}
          </main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  )
}