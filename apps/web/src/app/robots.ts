import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/config'

/** robots.txt: служебные разделы закрыты, карта сайта открыта */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/profile', '/bookmarks', '/history', '/login', '/register', '/search'],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  }
}