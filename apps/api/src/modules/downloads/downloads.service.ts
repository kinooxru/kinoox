/**
 * Бизнес-логика модуля дистрибуции приложений.
 *
 * Версии берутся из таблицы app_versions, описания платформ — из
 * статического реестра. API отдаёт ссылки вида
 * `https://kinoox.ru/downloads/kinoox-1.0.0.apk`, которые раздаёт Nginx.
 */
import type { PrismaClient } from '@prisma/client'
import type {
  AppPlatform,
  AppVersionDTO,
  ChangelogEntry,
  DownloadPlatformDTO,
  DownloadsListDTO,
} from '@kinoox/api-client'
import { cacheKeys, type CacheService } from '../../core/plugins/cache.plugin'
import { notFound } from '../../core/types'
import { config } from '../../config'
import { DOWNLOADS_BASE_PATH, PLATFORMS, PLATFORM_MAP } from './downloads.platforms'

/** Расширение файла для формата сборки */
const FORMAT_EXTENSIONS: Record<string, string> = {
  apk: 'apk',
  testflight: 'ipa',
  exe: 'exe',
  msi: 'msi',
  dmg: 'dmg',
  AppImage: 'AppImage',
  deb: 'deb',
  rpm: 'rpm',
}

export class DownloadsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache: CacheService | null = null,
  ) {}

  /** Все платформы с актуальными версиями — для страницы /download */
  async getPlatforms(): Promise<DownloadsListDTO> {
    const cached = await this.cache?.get<DownloadsListDTO>(cacheKeys.downloads())
    if (cached) return cached

    const versions = await this.prisma.appVersion.findMany({
      where: { isActive: true },
      orderBy: [{ platform: 'asc' }, { releaseDate: 'desc' }],
    })

    const platforms: DownloadPlatformDTO[] = PLATFORMS.map((descriptor) => {
      const version = versions.find((item) => item.platform === descriptor.platform)

      return {
        platform: descriptor.platform,
        title: descriptor.title,
        description: descriptor.description,
        version: version?.version ?? '1.0.0',
        size: version?.size ?? '—',
        minimumOs: version?.minimumOs ?? descriptor.minimumOs,
        features: descriptor.features,
        downloads: descriptor.formats.map((format) => ({
          label: format.label,
          url: this.buildDownloadUrl(
            descriptor.platform,
            version?.version ?? '1.0.0',
            format.format,
            version?.url,
          ),
          format: format.format,
        })),
        qrCodeUrl: descriptor.hasQr
          ? this.buildQrUrl(
              this.buildDownloadUrl(
                descriptor.platform,
                version?.version ?? '1.0.0',
                descriptor.formats[0]?.format ?? 'apk',
                version?.url,
              ),
            )
          : null,
        screenshots: descriptor.screenshots,
      }
    })

    const result: DownloadsListDTO = {
      platforms,
      updatedAt: new Date().toISOString(),
    }

    await this.cache?.set(cacheKeys.downloads(), result, 600)
    return result
  }

  /** Последняя версия конкретной платформы */
  async getLatest(platform: AppPlatform): Promise<AppVersionDTO | null> {
    this.ensurePlatform(platform)

    const cached = await this.cache?.get<AppVersionDTO | null>(cacheKeys.downloadsPlatform(platform))
    if (cached !== null && cached !== undefined) return cached

    const version = await this.prisma.appVersion.findFirst({
      where: { platform, isActive: true },
      orderBy: { releaseDate: 'desc' },
    })

    const result: AppVersionDTO | null = version
      ? {
          platform,
          version: version.version,
          url: version.url,
          size: version.size,
          minimumOs: version.minimumOs,
          changelog: version.changelog,
          releaseDate: version.releaseDate.toISOString(),
        }
      : null

    await this.cache?.set(cacheKeys.downloadsPlatform(platform), result, 600)
    return result
  }

  /** История версий: последняя раскрыта, остальные — аккордеоном */
  async getChangelog(platform?: AppPlatform): Promise<ChangelogEntry[]> {
    if (platform) this.ensurePlatform(platform)

    const cached = await this.cache?.get<ChangelogEntry[]>(cacheKeys.downloadsChangelog(platform))
    if (cached) return cached

    const versions = await this.prisma.appVersion.findMany({
      where: { isActive: true, ...(platform ? { platform } : {}) },
      orderBy: { releaseDate: 'desc' },
    })

    const result: ChangelogEntry[] = versions.map((version) => ({
      version: version.version,
      releaseDate: version.releaseDate.toISOString(),
      platform: version.platform as AppPlatform,
      changes: version.changelog,
    }))

    await this.cache?.set(cacheKeys.downloadsChangelog(platform), result, 600)
    return result
  }

  /** Все версии платформы */
  async getVersions(platform: AppPlatform): Promise<AppVersionDTO[]> {
    this.ensurePlatform(platform)

    const versions = await this.prisma.appVersion.findMany({
      where: { platform },
      orderBy: { releaseDate: 'desc' },
    })

    return versions.map((version) => ({
      platform,
      version: version.version,
      url: version.url,
      size: version.size,
      minimumOs: version.minimumOs,
      changelog: version.changelog,
      releaseDate: version.releaseDate.toISOString(),
    }))
  }

  /** Учесть скачивание — для статистики в StatsBar */
  async registerDownload(platform: AppPlatform): Promise<void> {
    this.ensurePlatform(platform)
    await this.prisma.appVersion
      .updateMany({
        where: { platform, isActive: true },
        data: { downloadsCount: { increment: 1 } },
      })
      .catch(() => undefined)
  }

  /** Суммарное количество загрузок по всем платформам */
  async getTotalDownloads(): Promise<number> {
    const aggregate = await this.prisma.appVersion.aggregate({ _sum: { downloadsCount: true } })
    return aggregate._sum.downloadsCount ?? 0
  }

  private ensurePlatform(platform: string): void {
    if (!PLATFORM_MAP[platform]) {
      throw notFound(`Платформа «${platform}» не поддерживается`)
    }
  }

  /**
   * Формирует публичный URL сборки. Если в БД записан внешний URL
   * (например, ссылка на MinIO), используем его как есть.
   */
  private buildDownloadUrl(
    platform: AppPlatform,
    version: string,
    format: string,
    storedUrl?: string,
  ): string {
    if (storedUrl && /^https?:\/\//.test(storedUrl)) {
      if (storedUrl.includes(`/${platform}/`) || storedUrl.split('/').pop()?.includes('.')) {
        // Внешняя ссылка вида https://cdn.kinoox.ru/android/kinoox-1.0.0.apk
        if (format === 'exe' || format === 'msi' || !storedUrl.endsWith('.')) return storedUrl
      }
      return storedUrl
    }

    const extension = FORMAT_EXTENSIONS[format] ?? format
    return `${config.server.publicUrl.replace('/api/v1', '')}${DOWNLOADS_BASE_PATH}/${platform}/kinoox-${version}.${extension}`
  }

  private buildQrUrl(target: string): string {
    const encoded = encodeURIComponent(target)
    return `${config.server.publicUrl.replace('/api/v1', '')}/api/qr?data=${encoded}`
  }
}
