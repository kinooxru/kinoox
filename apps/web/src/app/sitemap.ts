import type { MetadataRoute } from 'next'
import { api } from '@/lib/api'
import { siteConfig } from '@/lib/config'

export const revalidate = 3600

/** Карта сайта: статические разделы + страницы тайтлов из каталога */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteConfig.url, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${siteConfig.url}/movies`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteConfig.url}/series`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteConfig.url}/cartoons`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteConfig.url}/anime`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteConfig.url}/download`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteConfig.url}/support`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${siteConfig.url}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${siteConfig.url}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]

  try {
    // Забираем первые страницы каждого раздела — этого достаточно для индексации
    const [movies, series, cartoons, anime] = await Promise.all([
      api.titles.list({ type: 'movie', perPage: 100, sort: 'popular' }),
      api.titles.list({ type: 'serial', perPage: 100, sort: 'popular' }),
      api.titles.list({ type: 'cartoon', perPage: 100, sort: 'popular' }),
      api.titles.list({ type: 'anime', perPage: 100, sort: 'popular' }),
    ])

    const titleRoutes: MetadataRoute.Sitemap = [...movies.items, ...series.items, ...cartoons.items, ...anime.items].map(
      (title) => ({
        url: `${siteConfig.url}/title/${title.id}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }),
    )

    return [...staticRoutes, ...titleRoutes]
  } catch {
    return staticRoutes
  }
}