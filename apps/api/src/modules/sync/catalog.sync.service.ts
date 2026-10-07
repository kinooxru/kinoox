/**
 * Сервис синхронизации каталога с видеобалансерами (VeoVeo и Vibix).
 *
 * Автоматически подтягивает и обновляет:
 * - Постеры высокого разрешения (с CDN балансеров вместо локальных svg)
 * - Фоновые изображения (backdrop)
 * - Описания, рейтинги Кинопоиска/IMDb, длительность, года, страны, жанры
 * - Дерево сезонов и серий для сериалов
 * - Записи о доступных источниках (Source) для каждого балансера
 */
import { type PrismaClient, TitleStatus, TitleType } from '@prisma/client'
import type { CacheService } from '../../core/plugins/cache.plugin.js'
import { cacheKeys } from '../../core/plugins/cache.plugin.js'
import { config } from '../../config.js'
import type { BalancerTitleInfo } from '../players/players.types.js'
import { VeoveoService } from '../players/veoveo/veoveo.service.js'
import { VibixService } from '../players/vibix/vibix.service.js'

export interface SyncResult {
  titleId: number
  title: string
  type: TitleType
  kpId: number
  updated: boolean
  posterUrl: string
  backdropUrl: string | null
  sources: string[]
  episodesCount: number
}

export class CatalogSyncService {
  private readonly veoveo: VeoveoService
  private readonly vibix: VibixService

  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache: CacheService | null = null,
    services?: { veoveo?: VeoveoService; vibix?: VibixService },
  ) {
    this.veoveo = services?.veoveo ?? new VeoveoService()
    this.vibix = services?.vibix ?? new VibixService()
  }

  /**
   * Синхронизировать конкретный тайтл по ID Кинопоиска.
   * Опрашивает все активные балансеры и объединяет лучшие метаданные.
   */
  async syncByKpId(kpId: number): Promise<SyncResult | null> {
    const existingTitle = await this.prisma.title.findUnique({
      where: { kpId },
      include: { sources: true },
    })

    // Опрашиваем балансеры параллельно
    const [veoveoInfo, vibixInfo, veoveoEpisodes, vibixEpisodes] = await Promise.all([
      this.veoveo.enabled ? this.veoveo.getTitleInfo(kpId).catch(() => null) : Promise.resolve(null),
      this.vibix.enabled ? this.vibix.getTitleInfo(kpId).catch(() => null) : Promise.resolve(null),
      this.veoveo.enabled ? this.veoveo.getEpisodes(kpId).catch(() => []) : Promise.resolve([]),
      this.vibix.enabled ? this.vibix.getEpisodes(kpId).catch(() => []) : Promise.resolve([]),
    ])

    if (!veoveoInfo && !vibixInfo && !existingTitle) {
      return null
    }

    // Выбираем лучший постер (приоритет реальным внешним URL)
    const bestPoster =
      this.selectBestPoster([
        vibixInfo?.posterUrl,
        veoveoInfo?.posterUrl,
        existingTitle?.posterUrl,
      ]) ?? (existingTitle?.posterUrl || '/posters/1.svg')

    // Выбираем лучший фон
    const bestBackdrop =
      vibixInfo?.backdropUrl ||
      veoveoInfo?.backdropUrl ||
      (existingTitle?.backdropUrl && !existingTitle.backdropUrl.endsWith('.svg')
        ? existingTitle.backdropUrl
        : vibixInfo?.posterUrl || veoveoInfo?.posterUrl || null)

    // Выбираем описание
    const bestDescription =
      vibixInfo?.description ||
      veoveoInfo?.description ||
      existingTitle?.description ||
      null

    // Рейтинги
    const rawKp =
      vibixInfo?.kpRating ??
      veoveoInfo?.kpRating ??
      (existingTitle?.ratingKp ? Number(existingTitle.ratingKp) : null)
    const rawImdb =
      vibixInfo?.imdbRating ??
      veoveoInfo?.imdbRating ??
      (existingTitle?.ratingImdb ? Number(existingTitle.ratingImdb) : null)

    const numKp = rawKp !== null && rawKp !== undefined ? Number(rawKp) : NaN
    const numImdb = rawImdb !== null && rawImdb !== undefined ? Number(rawImdb) : NaN
    const kpRating = Number.isFinite(numKp) && numKp > 0 ? Number(numKp.toFixed(1)) : null
    const imdbRating = Number.isFinite(numImdb) && numImdb > 0 ? Number(numImdb.toFixed(1)) : null

    // Год, длительность, жанры, страны
    const year =
      vibixInfo?.year ??
      veoveoInfo?.year ??
      existingTitle?.year ??
      new Date().getFullYear()
    const duration =
      vibixInfo?.duration ??
      veoveoInfo?.duration ??
      existingTitle?.duration ??
      null

    const genres = this.mergeUniqueArrays(
      existingTitle?.genres ?? [],
      vibixInfo?.genres ?? [],
      veoveoInfo?.genres ?? [],
    )
    const countries = this.mergeUniqueArrays(
      existingTitle?.countries ?? [],
      vibixInfo?.countries ?? [],
      veoveoInfo?.countries ?? [],
    )

    // Определяем точный тип тайтла: аниме, мультфильм, сериал или фильм
    const resolvedType = this.resolveTitleType({
      existingType: existingTitle?.type,
      genres,
      countries,
      isSerial: veoveoEpisodes.length > 0 || vibixEpisodes.length > 0,
      rawType: vibixInfo?.type || veoveoInfo?.type,
    })

    const titleText =
      existingTitle?.title ||
      vibixInfo?.nameRus ||
      vibixInfo?.name ||
      veoveoInfo?.nameRus ||
      veoveoInfo?.name ||
      `Тайтл ${kpId}`

    const originalTitle =
      existingTitle?.originalTitle ||
      vibixInfo?.nameOriginal ||
      vibixInfo?.nameEng ||
      veoveoInfo?.nameOriginal ||
      null

    const hasEpisodes = veoveoEpisodes.length > 0 || vibixEpisodes.length > 0
    const endYear = veoveoInfo?.endYear ?? null

    const resolvedStatus = this.resolveTitleStatus({
      existingStatus: existingTitle?.status as TitleStatus | undefined,
      type: resolvedType,
      year: typeof year === 'number' && year > 0 ? year : null,
      endYear,
      hasEpisodes,
    })

    // Сохраняем или обновляем тайтл в БД
    const titleData = {
      kpId,
      imdbId: existingTitle?.imdbId || vibixInfo?.imdbId || veoveoInfo?.imdbId || null,
      type: resolvedType,
      title: titleText,
      originalTitle,
      description: bestDescription,
      posterUrl: bestPoster,
      backdropUrl: bestBackdrop,
      year: typeof year === 'number' && year > 0 ? year : existingTitle?.year ?? 2000,
      ratingKp: kpRating,
      ratingImdb: imdbRating,
      duration,
      countries,
      genres,
      status: resolvedStatus,
    }

    const savedTitle = await this.prisma.title.upsert({
      where: { kpId },
      update: titleData,
      create: {
        ...titleData,
        actors: existingTitle?.actors ?? [],
        directors: existingTitle?.directors ?? [],
      },
    })

    // Обновляем источники (sources)
    const savedSources: string[] = []
    if (veoveoInfo || veoveoEpisodes.length > 0) {
      await this.prisma.source.upsert({
        where: { titleId_balancer: { titleId: savedTitle.id, balancer: 'veoveo' } },
        update: {
          balancerId: veoveoInfo?.balancerId ?? String(kpId),
          quality: 'auto',
          priority: config.players.veoveo.priority,
        },
        create: {
          titleId: savedTitle.id,
          balancer: 'veoveo',
          balancerId: veoveoInfo?.balancerId ?? String(kpId),
          quality: 'auto',
          priority: config.players.veoveo.priority,
        },
      })
      savedSources.push('veoveo')
    }

    if (vibixInfo || vibixEpisodes.length > 0) {
      await this.prisma.source.upsert({
        where: { titleId_balancer: { titleId: savedTitle.id, balancer: 'vibix' } },
        update: {
          balancerId: vibixInfo?.balancerId ?? String(kpId),
          quality: vibixInfo?.quality ?? 'FullHD',
          priority: config.players.vibix.priority,
        },
        create: {
          titleId: savedTitle.id,
          balancer: 'vibix',
          balancerId: vibixInfo?.balancerId ?? String(kpId),
          quality: vibixInfo?.quality ?? 'FullHD',
          priority: config.players.vibix.priority,
        },
      })
      savedSources.push('vibix')
    }

    // Обновляем серии, если это сериал (берём дерево серий с максимальным числом)
    const bestSeasons = veoveoEpisodes.length >= vibixEpisodes.length ? veoveoEpisodes : vibixEpisodes
    let episodesCount = 0

    if (bestSeasons.length > 0) {
      const episodesToSave: Array<{ season: number; episode: number; name?: string }> = []
      bestSeasons.forEach((season, sIdx) => {
        const seasonMatch = String(season.name).match(/\d+/)
        const seasonNumber = seasonMatch ? Number(seasonMatch[0]) : sIdx + 1
        if (seasonNumber > 0) {
          season.series.forEach((ep, epIdx) => {
            episodesToSave.push({
              season: seasonNumber,
              episode: epIdx + 1,
              name: ep.name ? String(ep.name) : `Серия ${epIdx + 1}`,
            })
          })
        }
      })

      if (episodesToSave.length > 0) {
        await this.prisma.$transaction([
          this.prisma.episode.deleteMany({ where: { titleId: savedTitle.id } }),
          this.prisma.episode.createMany({
            data: episodesToSave.map((item) => ({
              titleId: savedTitle.id,
              season: item.season,
              episode: item.episode,
              name: item.name ?? null,
            })),
            skipDuplicates: true,
          }),
        ])
        episodesCount = episodesToSave.length
      }
    }

    // Сбрасываем кэш
    if (this.cache) {
      await Promise.all([
        this.cache.del(cacheKeys.title(savedTitle.id)),
        this.cache.del(cacheKeys.titleEpisodes(savedTitle.id)),
        this.cache.del(cacheKeys.titleSources(savedTitle.id)),
        this.cache.del(cacheKeys.filters()),
        this.cache.del(cacheKeys.collections()),
      ])
    }

    return {
      titleId: savedTitle.id,
      title: savedTitle.title,
      type: savedTitle.type,
      kpId,
      updated: true,
      posterUrl: savedTitle.posterUrl,
      backdropUrl: savedTitle.backdropUrl,
      sources: savedSources,
      episodesCount,
    }
  }

  /**
   * Синхронизировать все существующие тайтлы в БД с балансерами.
   */
  async syncAllExistingTitles(): Promise<SyncResult[]> {
    const titles = await this.prisma.title.findMany({
      where: { kpId: { not: null } },
      select: { id: true, kpId: true, title: true },
      orderBy: { id: 'asc' },
    })

    const results: SyncResult[] = []
    for (const item of titles) {
      if (!item.kpId) continue
      try {
        const res = await this.syncByKpId(item.kpId)
        if (res) results.push(res)
      } catch (err) {
        // Логируем ошибку, но не прерываем остальные тайтлы
        console.error(`[CatalogSync] Ошибка синхронизации тайтла ${item.title} (kp: ${item.kpId}):`, err)
      }
    }
    return results
  }

  /**
   * Синхронизировать только активные онгоинги (выходящие сериалы и аниме)
   * для быстрого подтягивания свежих серий.
   */
  async syncOngoingTitles(): Promise<SyncResult[]> {
    const ongoingTitles = await this.prisma.title.findMany({
      where: {
        kpId: { not: null },
        status: TitleStatus.ongoing,
      },
      select: { id: true, kpId: true, title: true },
      orderBy: { updatedAt: 'asc' },
    })

    const results: SyncResult[] = []
    for (const item of ongoingTitles) {
      if (!item.kpId) continue
      try {
        const res = await this.syncByKpId(item.kpId)
        if (res) results.push(res)
      } catch (err) {
        console.error(`[CatalogSync] Ошибка обновления онгоинга ${item.title} (kp: ${item.kpId}):`, err)
      }
    }
    return results
  }

  /**
   * Интеллектуальное определение категории: аниме, мультфильм, сериал или фильм.
   */
  resolveTitleType(params: {
    existingType?: TitleType
    genres: string[]
    countries: string[]
    isSerial: boolean
    rawType?: string | null
  }): TitleType {
    const genresLower = params.genres.map((g) => g.toLowerCase())
    const countriesLower = params.countries.map((c) => c.toLowerCase())

    // 1. Аниме: явный жанр 'аниме' или производство Японии с анимацией
    const hasAnimeGenre = genresLower.some((g) => g.includes('аниме') || g.includes('anime'))
    const isJapaneseAnimation =
      countriesLower.some((c) => c.includes('япония') || c.includes('japan')) &&
      genresLower.some((g) => g.includes('мульт') || g.includes('анимац') || g.includes('animat'))

    if (hasAnimeGenre || isJapaneseAnimation) {
      return TitleType.anime
    }

    // 2. Мультфильм: жанр анимации или мультфильма (если не аниме)
    const isCartoon = genresLower.some((g) =>
      g.includes('мультфильм') ||
      g.includes('мультик') ||
      g.includes('анимация') ||
      g.includes('детский') ||
      g.includes('семейный') && genresLower.some((sub) => sub.includes('анимац')),
    )
    if (isCartoon) {
      return TitleType.cartoon
    }

    // 3. Сериал: наличие серий или пометка serial/series
    if (
      params.isSerial ||
      params.rawType === 'serial' ||
      params.rawType === 'series' ||
      params.existingType === TitleType.serial
    ) {
      return TitleType.serial
    }

    // 4. Фильм (полнометражный фильм по умолчанию)
    return params.existingType ?? TitleType.movie
  }

  /**
   * Интеллектуальное определение статуса выхода:
   * - released: фильм, либо завершённый сериал/аниме
   * - ongoing: выходящий сериал/аниме (свежий проект с сериями)
   * - announced: анонсированный проект без серий
   */
  resolveTitleStatus(params: {
    existingStatus?: TitleStatus
    type: TitleType
    year: number | null
    endYear?: number | null
    hasEpisodes: boolean
  }): TitleStatus {
    // 1. Полнометражные фильмы всегда завершены
    if (params.type === TitleType.movie) {
      return TitleStatus.released
    }

    const currentYear = new Date().getFullYear()

    // 2. Если балансер передал год окончания сериала (endYear)
    if (params.endYear && params.endYear > 0) {
      return params.endYear <= currentYear ? TitleStatus.released : TitleStatus.ongoing
    }

    // 3. Если у тайтла в БД уже был статус 'released', сохраняем его
    if (params.existingStatus === TitleStatus.released) {
      return TitleStatus.released
    }

    // 4. Если нет серий вовсе
    if (!params.hasEpisodes) {
      if (params.year && params.year > currentYear) {
        return TitleStatus.announced
      }
      return TitleStatus.released
    }

    // 5. Сериалы/аниме, вышедшие более года назад и без явного флага онгоинга в БД, завершены
    if (params.year && params.year < currentYear - 1 && params.existingStatus !== TitleStatus.ongoing) {
      return TitleStatus.released
    }

    // 6. Свежие сериалы с сериями считаются выходящими (ongoing)
    return TitleStatus.ongoing
  }

  /**
   * Автоматический импорт свежих поступлений (фильмы, сериалы, мультфильмы, аниме)
   * из обоих балансеров: VeoVeo и Vibix.
   */
  async importLatestFromBalancers(options?: {
    veoveoPages?: number
    vibixLimit?: number
  }): Promise<{ imported: number; items: SyncResult[] }> {
    const veoveoPages = options?.veoveoPages ?? 3
    const vibixLimit = options?.vibixLimit ?? 50
    const discoveredKpIds = new Set<number>()

    // 1. Сканируем свежие поступления из VeoVeo
    if (this.veoveo.enabled) {
      for (let page = 1; page <= veoveoPages; page++) {
        try {
          const list = await this.veoveo.listContents({
            pagination: { page, pageSize: 20, type: 'page' },
          })
          for (const item of list.data) {
            if (item.kinopoiskId && item.kinopoiskId > 0) {
              discoveredKpIds.add(item.kinopoiskId)
            }
          }
          if (!list.meta.hasNextPage) break
        } catch {
          break
        }
      }
    }

    // 2. Сканируем свежие поступления из Vibix
    if (this.vibix.enabled) {
      try {
        const vibList = await this.vibix.listVideos({
          page: 1,
          limit: Math.min(100, vibixLimit),
          existKpId: true,
        })
        for (const item of vibList.items) {
          if (item.kp_id && item.kp_id > 0) {
            discoveredKpIds.add(item.kp_id)
          }
        }
      } catch {
        // Ошибка сканирования Vibix не блокирует общий импорт
      }
    }

    // 3. Синхронизируем каждый найденный тайтл в БД
    const syncedItems: SyncResult[] = []
    for (const kpId of discoveredKpIds) {
      try {
        const result = await this.syncByKpId(kpId)
        if (result) {
          syncedItems.push(result)
        }
      } catch (err) {
        console.error(`[CatalogSync] Ошибка импорта тайтла kpId=${kpId}:`, err)
      }
    }

    return { imported: syncedItems.length, items: syncedItems }
  }
  private selectBestPoster(candidates: Array<string | null | undefined>): string | null {
    for (const url of candidates) {
      if (!url) continue
      // Игнорируем локальные svg-заглушки вида /posters/*.svg
      if (url.startsWith('/posters/') || url.endsWith('.svg')) continue
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url
      }
    }
    return null
  }

  private mergeUniqueArrays(...arrays: string[][]): string[] {
    const set = new Set<string>()
    for (const arr of arrays) {
      for (const item of arr) {
        const trimmed = item.trim()
        if (trimmed) set.add(trimmed)
      }
    }
    return Array.from(set)
  }
}
