/**
 * Бизнес-логика каталога. Не знает ничего про HTTP.
 */
import type { Prisma, PrismaClient } from '@prisma/client'
import type {
  EpisodeDTO,
  FilterOptionsDTO,
  PaginatedResponse,
  SourceDTO,
  TitleCardDTO,
  TitleDTO,
  TitleStatus,
  TitleType,
} from '@kinoox/api-client'
import { cacheKeys, type CacheService } from '../../core/plugins/cache.plugin.js'
import { notFound } from '../../core/types.js'
import { hashParams, toNumber } from '../../utils.js'
import type { TitleListFilter, TitleUpsertInput } from './titles.types.js'

const CARD_SELECT = {
  id: true,
  type: true,
  title: true,
  originalTitle: true,
  posterUrl: true,
  year: true,
  ratingKp: true,
  genres: true,
  status: true,
} as const

/** Строка тайтла из выборки каталога */
interface TitleRow {
  id: number
  kpId: number | null
  imdbId: string | null
  type: string
  title: string
  originalTitle: string | null
  description: string | null
  posterUrl: string
  backdropUrl: string | null
  year: number
  ratingKp: unknown
  ratingImdb: unknown
  duration: number | null
  countries: string[]
  genres: string[]
  actors: string[]
  directors: string[]
  status: string
  createdAt: Date
  updatedAt: Date
}

export class TitlesService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache: CacheService | null = null,
  ) {}

  // ── Чтение ─────────────────────────────────────────────────

  async getList(filter: TitleListFilter): Promise<PaginatedResponse<TitleCardDTO>> {
    const cacheKey = cacheKeys.titleList(hashParams(filter as unknown as Record<string, unknown>))
    if (this.cache) {
      const cached = await this.cache.get<PaginatedResponse<TitleCardDTO>>(cacheKey)
      if (cached) return cached
    }

    const where = this.buildWhere(filter)
    const [items, total] = await Promise.all([
      this.prisma.title.findMany({
        where,
        select: CARD_SELECT,
        orderBy: this.buildOrderBy(filter.sort),
        skip: (filter.page - 1) * filter.perPage,
        take: filter.perPage,
      }),
      this.prisma.title.count({ where }),
    ])

    const result: PaginatedResponse<TitleCardDTO> = {
      items: items.map((item) => this.toCard(item)),
      meta: {
        page: filter.page,
        perPage: filter.perPage,
        total,
        totalPages: Math.max(1, Math.ceil(total / filter.perPage)),
      },
    }

    await this.cache?.set(cacheKey, result, 300)
    return result
  }

  async getById(id: number): Promise<TitleDTO> {
    const cached = await this.cache?.get<TitleDTO>(cacheKeys.title(id))
    if (cached) return cached

    const title = await this.prisma.title.findUnique({
      where: { id },
      include: {
        _count: { select: { episodes: true } },
        episodes: { distinct: ['season'], select: { season: true } },
      },
    })

    if (!title) throw notFound('Тайтл не найден')

    const dto = this.toDto(title)
    await this.cache?.set(cacheKeys.title(id), dto, 600)
    return dto
  }

  /** Тайтл по ID Кинопоиска — используется синхронизацией и плеером */
  async getByKpId(kpId: number): Promise<TitleDTO | null> {
    const title = await this.prisma.title.findUnique({ where: { kpId } })
    return title ? this.toDto(title) : null
  }

  async getEpisodes(titleId: number): Promise<EpisodeDTO[]> {
    const cached = await this.cache?.get<EpisodeDTO[]>(cacheKeys.titleEpisodes(titleId))
    if (cached) return cached

    const episodes = await this.prisma.episode.findMany({
      where: { titleId },
      orderBy: [{ season: 'asc' }, { episode: 'asc' }],
    })

    const dto: EpisodeDTO[] = episodes.map((episode) => ({
      id: episode.id,
      titleId: episode.titleId,
      season: episode.season,
      episode: episode.episode,
      name: episode.name,
    }))

    await this.cache?.set(cacheKeys.titleEpisodes(titleId), dto, 600)
    return dto
  }

  async getSourceRecords(titleId: number): Promise<SourceDTO[]> {
    const sources = await this.prisma.source.findMany({
      where: { titleId },
      orderBy: { priority: 'asc' },
    })

    return sources.map((source) => ({
      id: source.id,
      titleId: source.titleId,
      balancer: source.balancer === 'veoveo' ? 'veoveo' : 'vibix',
      balancerId: source.balancerId,
      quality: source.quality,
      priority: source.priority,
    }))
  }

  /** Ссылки на тайтл, нужные оркестратору балансеров */
  async getTitleRefs(
    titleId: number,
  ): Promise<{ titleId: number; kpId: number | null; imdbId: string | null } | null> {
    const title = await this.prisma.title.findUnique({
      where: { id: titleId },
      select: { id: true, kpId: true, imdbId: true },
    })
    if (!title) return null
    return { titleId: title.id, kpId: title.kpId, imdbId: title.imdbId }
  }

  /** Похожие тайтлы: совпадение по типу и хотя бы одному жанру */
  async getRelated(titleId: number, limit: number): Promise<TitleCardDTO[]> {
    const title = await this.prisma.title.findUnique({
      where: { id: titleId },
      select: { id: true, type: true, genres: true },
    })
    if (!title) return []

    const items = await this.prisma.title.findMany({
      where: {
        id: { not: titleId },
        type: title.type,
        ...(title.genres.length > 0 ? { genres: { hasSome: title.genres } } : {}),
      },
      select: CARD_SELECT,
      orderBy: [{ ratingKp: 'desc' }, { viewsCount: 'desc' }],
      take: limit,
    })

    return items.map((item) => this.toCard(item))
  }

  /** «Сейчас смотрят»: популярное, исключая сам тайтл */
  async getSimilar(titleId: number, limit: number): Promise<TitleCardDTO[]> {
    const items = await this.prisma.title.findMany({
      where: { id: { not: titleId } },
      select: CARD_SELECT,
      orderBy: [{ viewsCount: 'desc' }, { ratingKp: 'desc' }],
      take: limit,
    })
    return items.map((item) => this.toCard(item))
  }

  /** Доступные значения фильтров каталога */
  async getFilters(): Promise<FilterOptionsDTO> {
    const cached = await this.cache?.get<FilterOptionsDTO>(cacheKeys.filters())
    if (cached) return cached

    const [genresRaw, countriesRaw, yearsRaw] = await Promise.all([
      this.prisma.$queryRaw<Array<{ value: string }>>`
        SELECT DISTINCT unnest("genres") AS value FROM "titles" ORDER BY value
      `,
      this.prisma.$queryRaw<Array<{ value: string }>>`
        SELECT DISTINCT unnest("countries") AS value FROM "titles" ORDER BY value
      `,
      this.prisma.title.findMany({
        distinct: ['year'],
        select: { year: true },
        orderBy: { year: 'desc' },
      }),
    ])

    const result: FilterOptionsDTO = {
      genres: genresRaw.map((row) => row.value).filter(Boolean),
      countries: countriesRaw.map((row) => row.value).filter(Boolean),
      years: yearsRaw.map((row) => row.year),
    }

    await this.cache?.set(cacheKeys.filters(), result, 3600)
    return result
  }

  /** Подборки главной страницы */
  async getCollections(): Promise<{
    trending: PaginatedResponse<TitleCardDTO>
    newReleases: PaginatedResponse<TitleCardDTO>
    topRated: PaginatedResponse<TitleCardDTO>
    anime: PaginatedResponse<TitleCardDTO>
  }> {
    const cached = await this.cache?.get<Awaited<ReturnType<TitlesService['getCollections']>>>(
      cacheKeys.collections(),
    )
    if (cached) return cached

    const [trending, newReleases, topRated, anime] = await Promise.all([
      this.getList({ sort: 'popular', page: 1, perPage: 18 }),
      this.getList({ sort: 'newest', page: 1, perPage: 18 }),
      this.getList({ sort: 'rating', page: 1, perPage: 18 }),
      this.getList({ type: 'anime', sort: 'popular', page: 1, perPage: 18 }),
    ])

    const result = { trending, newReleases, topRated, anime }
    await this.cache?.set(cacheKeys.collections(), result, 300)
    return result
  }

  // ── Запись ─────────────────────────────────────────────────

  /** Создать или обновить тайтл по внешнему идентификатору — для синхронизации */
  async upsertByExternalId(input: TitleUpsertInput): Promise<number> {
    const existing = input.kpId
      ? await this.prisma.title.findUnique({ where: { kpId: input.kpId }, select: { id: true } })
      : input.imdbId
        ? await this.prisma.title.findUnique({ where: { imdbId: input.imdbId }, select: { id: true } })
        : null

    const data = {
      kpId: input.kpId ?? null,
      imdbId: input.imdbId ?? null,
      type: input.type,
      title: input.title,
      originalTitle: input.originalTitle ?? null,
      description: input.description ?? null,
      posterUrl: input.posterUrl,
      backdropUrl: input.backdropUrl ?? null,
      year: input.year,
      ratingKp: input.ratingKp ?? null,
      ratingImdb: input.ratingImdb ?? null,
      duration: input.duration ?? null,
      countries: input.countries,
      genres: input.genres,
      actors: input.actors ?? [],
      directors: input.directors ?? [],
      status: input.status,
    }

    if (existing) {
      await this.prisma.title.update({ where: { id: existing.id }, data })
      await this.cache?.del(cacheKeys.title(existing.id))
      return existing.id
    }

    const created = await this.prisma.title.create({ data })
    return created.id
  }

  /** Заменить серии тайтла */
  async replaceEpisodes(
    titleId: number,
    episodes: Array<{ season: number; episode: number; name?: string | null; externalId?: string | null }>,
  ): Promise<number> {
    await this.prisma.$transaction([
      this.prisma.episode.deleteMany({ where: { titleId } }),
      this.prisma.episode.createMany({
        data: episodes.map((episode) => ({
          titleId,
          season: episode.season,
          episode: episode.episode,
          name: episode.name ?? null,
          externalId: episode.externalId ?? null,
        })),
        skipDuplicates: true,
      }),
    ])

    await this.cache?.del(cacheKeys.titleEpisodes(titleId), cacheKeys.title(titleId))
    return episodes.length
  }

  /** Сохранить запись об источнике балансера */
  async upsertSource(
    titleId: number,
    source: { balancer: string; balancerId: string; quality: string; priority: number },
  ): Promise<void> {
    await this.prisma.source.upsert({
      where: { titleId_balancer: { titleId, balancer: source.balancer } },
      create: {
        titleId,
        balancer: source.balancer,
        balancerId: source.balancerId,
        quality: source.quality,
        priority: source.priority,
      },
      update: {
        balancerId: source.balancerId,
        quality: source.quality,
        priority: source.priority,
      },
    })
    await this.cache?.del(cacheKeys.titleSources(titleId))
  }

  /** Увеличить счётчик просмотров — влияет на сортировку «популярное» */
  async incrementViews(titleId: number): Promise<void> {
    await this.prisma.title
      .update({ where: { id: titleId }, data: { viewsCount: { increment: 1 } } })
      .catch(() => undefined)
    await this.cache?.delByPattern(`kinoox:titles:list:*`)
  }

  /** Полная очистка кэша каталога — после синхронизации */
  async invalidateCatalogCache(): Promise<void> {
    await this.cache?.delByPattern('kinoox:titles:*')
    await this.cache?.del(cacheKeys.collections(), cacheKeys.filters())
  }

  // ── Служебное ──────────────────────────────────────────────

  private buildWhere(filter: TitleListFilter): Prisma.TitleWhereInput {
    const where: Prisma.TitleWhereInput = {}

    if (filter.type) where.type = filter.type
    if (filter.year) where.year = filter.year
    if (filter.genre) where.genres = { has: filter.genre }
    if (filter.country) where.countries = { has: filter.country }
    if (typeof filter.minRating === 'number') where.ratingKp = { gte: filter.minRating }

    return where
  }

  private buildOrderBy(sort: TitleListFilter['sort']): Prisma.TitleOrderByWithRelationInput[] {
    switch (sort) {
      case 'rating':
        return [{ ratingKp: 'desc' }, { viewsCount: 'desc' }]
      case 'year':
        return [{ year: 'desc' }, { title: 'asc' }]
      case 'newest':
        return [{ createdAt: 'desc' }]
      case 'popular':
      default:
        return [{ viewsCount: 'desc' }, { ratingKp: 'desc' }]
    }
  }

  private toCard(title: {
    id: number
    type: string
    title: string
    originalTitle: string | null
    posterUrl: string
    year: number
    ratingKp: unknown
    genres: string[]
    status: string
  }): TitleCardDTO {
    return {
      id: title.id,
      type: title.type as TitleType,
      title: title.title,
      originalTitle: title.originalTitle,
      posterUrl: title.posterUrl,
      year: title.year,
      ratingKp: toNumber(title.ratingKp as { toNumber(): number } | number | null | undefined),
      genres: title.genres,
      status: title.status as TitleStatus,
    }
  }

  private toDto(
    title: TitleRow & {
      _count?: { episodes: number }
      episodes?: Array<{ season: number }>
    },
  ): TitleDTO {
    return {
      id: title.id,
      kpId: title.kpId,
      imdbId: title.imdbId,
      type: title.type as TitleType,
      title: title.title,
      originalTitle: title.originalTitle,
      description: title.description,
      posterUrl: title.posterUrl,
      backdropUrl: title.backdropUrl,
      year: title.year,
      ratingKp: toNumber(title.ratingKp as { toNumber(): number } | number | null | undefined),
      ratingImdb: toNumber(title.ratingImdb as { toNumber(): number } | number | null | undefined),
      duration: title.duration,
      countries: title.countries,
      genres: title.genres,
      actors: title.actors,
      directors: title.directors,
      status: title.status as TitleStatus,
      episodesCount: title._count?.episodes,
      seasonsCount: title.episodes
        ? new Set(title.episodes.map((row: { season: number }) => row.season)).size
        : undefined,
      createdAt: title.createdAt.toISOString(),
      updatedAt: title.updatedAt.toISOString(),
    }
  }
}
