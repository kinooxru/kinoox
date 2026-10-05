import type { Metadata } from 'next'
import type { AppPlatform, ChangelogEntry, DownloadsListDTO, SystemStatsDTO } from '@kinoox/api-client'
import { DownloadHero } from '@/components/download/DownloadHero'
import { PlatformSelector } from '@/components/download/PlatformSelector'
import {
  ChangelogSection,
  DownloadFooterCTA,
  FAQSection,
} from '@/components/download/ChangelogSection'
import { FeatureShowcase, ScreenshotsGallery, StatsBar } from '@/components/download/FeatureShowcase'
import { api } from '@/lib/api'
import { siteConfig } from '@/lib/config'
import { PLATFORM_MAP } from '@/lib/platforms'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Скачать приложение',
  description:
    'Скачайте нативные приложения KINOOX: APK для Android, TestFlight для iOS, .exe и .msi для Windows, .dmg для macOS, AppImage, .deb и .rpm для Linux. Не PWA — нативные.',
  alternates: { canonical: '/download' },
  openGraph: {
    title: 'Приложения KINOOX для всех устройств',
    description:
      'Полноценные нативные приложения для Android, iOS, Windows, macOS и Linux. Не PWA — нативные.',
    url: `${siteConfig.url}/download`,
    images: [{ url: '/brand/og-image.png', width: 1200, height: 630, alt: 'KINOOX' }],
  },
}

/** Пустой набор платформ: страница рендерится даже при недоступном API */
function fallbackPlatforms(): DownloadsListDTO {
  return {
    platforms: Object.values(PLATFORM_MAP).map((descriptor) => ({
      platform: descriptor.platform,
      title: descriptor.title,
      description: descriptor.description,
      version: '1.0.0',
      size: descriptor.size,
      minimumOs: descriptor.minimumOs,
      features: descriptor.features,
      downloads: descriptor.formats.map((format) => ({
        label: format.label,
        url: `/downloads/${descriptor.platform}/kinoox-1.0.0.${format.extension}`,
        format: format.format,
      })),
      qrCodeUrl: descriptor.hasQr
        ? `/api/qr?data=${encodeURIComponent(
            `https://${siteConfig.domain}/downloads/${descriptor.platform}/kinoox-1.0.0.${descriptor.formats[0]?.extension ?? 'apk'}`,
          )}`
        : null,
      screenshots: descriptor.screenshots,
    })),
    updatedAt: new Date().toISOString(),
  }
}

export default async function DownloadPage() {
  let downloads: DownloadsListDTO
  let changelog: ChangelogEntry[] = []
  let stats: SystemStatsDTO | null = null

  try {
    const [downloadsRes, changelogRes, statsRes] = await Promise.allSettled([
      api.downloads.list(),
      api.downloads.changelog().catch(() => []),
      api.system.stats(),
    ])
    downloads = downloadsRes.status === 'fulfilled' ? downloadsRes.value : fallbackPlatforms()
    changelog = changelogRes.status === 'fulfilled' ? changelogRes.value : []
    stats = statsRes.status === 'fulfilled' ? statsRes.value : null
  } catch {
    downloads = fallbackPlatforms()
    changelog = []
    stats = null
  }

  // Скриншоты по платформам для галереи
  const screenshots = downloads.platforms.reduce(
    (accumulator, item) => {
      accumulator[item.platform] = item.screenshots
      return accumulator
    },
    {} as Record<AppPlatform, string[]>,
  )

  return (
    <>
      {/* 1. DownloadHero */}
      <DownloadHero />

      {/* 2. PlatformSelector — 5 табов с morph-анимацией */}
      <PlatformSelector platforms={downloads.platforms} />

      {/* 3. FeatureShowcase — сетка 3×2 */}
      <FeatureShowcase />

      {/* 4. ScreenshotsGallery — меняется по платформе, zoom по клику, параллакс */}
      <ScreenshotsGallery screenshots={screenshots} />

      {/* 5. StatsBar — живая статистика из базы данных с анимацией и автообновлением */}
      <StatsBar initialStats={stats} />

      {/* 6. ChangelogSection — версии из API /api/v1/downloads/changelog */}
      <ChangelogSection entries={changelog} />

      {/* 7. FAQSection — аккордеон с вопросами */}
      <FAQSection />

      {/* 8. Подвал страницы: CTA и ссылки */}
      <DownloadFooterCTA />
    </>
  )
}