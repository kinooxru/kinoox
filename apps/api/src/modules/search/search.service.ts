/**
 * Бизнес-логика поиска.
 *
 * Полнотекстовый поиск по названию и оригинальному названию (PostgreSQL ILIKE
 * с триграммами), с дозаписью запросов в историю пользователя и топом популярных.
 */
import type { PrismaClient } from '@prisma/client'
import type { PaginatedResponse, SearchResultDTO, TitleCardDTO } from '@kinoox/api-client'
import { cacheKeys, type CacheService } from '../../core/plugins/cache.plugin'
import { normalizeQuery, paginated, toNumber } from '../../utils'

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

/** Минимальная длина запроса, которую имеет смысл кэшировать как подсказку */
const MIN_TRIGRAM_LENGTH = 3

export class SearchService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache: CacheService | null = null,
  ) {}

  async search(
    query: string,
    options: { type?: string; page: number; perPage: number; userId?: number | null },
  ): Promise<SearchResultDTO> {
    const normalized = normalizeQuery(query)
    const where = {
      ...(options.type ? { type: options.type as 'movie' | 'serial' | 'cartoon' | 'anime' } : {}),
      OR: [
        { title: { contains: normalized, mode: 'insensitive' as const } },
        { originalTitle: { contains: normalized, mode: 'insensitive' as const } },
        { genres: { has: normalized } },
      ],
    }

    const [items, total] = await Promise.all([
      this.prisma.title.findMany({
        where,
        select: CARD_SELECT,
        orderBy: [{ viewsCount: 'desc' }, { ratingKp: 'desc' }],
        skip: (options.page - 1) * options.perPage,
        take: options.perPage,
      }),
      this.prisma.title.count({ where }),
    ])

    // Историю поиска пишем только для осмысленных запросов
    if (normalized.length >= MIN_TRIGRAM_LENGTH) {
      await this.recordQuery(normalized, options.userId ?? null)
    }

    const result: PaginatedResponse<TitleCardDTO> = paginated(
      items.map((item) => this.toCard(item)),
      options.page,
      options.perPage,
      total,
    )

    return {
      query: normalized,
      items: result.items,
      meta: result.meta,
    }
  }

  /** Быстрые подсказки для expandable-поиска в шапке */
  async suggest(query: string, limit: number): Promise<TitleCardDTO[]> {
    const normalized = normalizeQuery(query)
    if (normalized.length < 2) return []

    const cacheKey = cacheKeys.suggest(normalized)
    if (this.cache) {
      const cached = await this.cache.get<TitleCardDTO[]>(cacheKey)
      if (cached) return cached
    }

    const items = await this.prisma.title.findMany({
      where: {
        OR: [
          { title: { startsWith: normalized, mode: 'insensitive' } },
          { title: { contains: normalized, mode: 'insensitive' } },
          { originalTitle: { contains: normalized, mode: 'insensitive' } },
        ],
      },
      select: CARD_SELECT,
      orderBy: [{ viewsCount: 'desc' }, { ratingKp: 'desc' }],
      take: limit,
    })

    const result = items.map((item) => this.toCard(item))
    await this.cache?.set(cacheKey, result, 120)
    return result
  }

  /** Топ популярных запросов за последние 30 дней */
  async trending(limit: number): Promise<string[]> {
    const cached = await this.cache?.get<string[]>(cacheKeys.trending())
    if (cached) return cached

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const grouped = await this.prisma.searchQuery.groupBy({
      by: ['query'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { query: 'desc' } },
      take: limit,
    })

    const result = grouped.map((row) => row.query)
    await this.cache?.set(cacheKeys.trending(), result, 3600)
    return result
  }

  /** История поиска пользователя */
  async getHistory(userId: number, limit = 20): Promise<string[]> {
    const rows = await this.prisma.searchQuery.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit * 3,
      select: { query: true },
    })

    // Убираем повторы, сохраняя порядок
    const seen = new Set<string>()
    const result: string[] = []
    for (const row of rows) {
      if (seen.has(row.query)) continue
      seen.add(row.query)
      result.push(row.query)
      if (result.length >= limit) break
    }
    return result
  }

  async clearHistory(userId: number): Promise<void> {
    await this.prisma.searchQuery.deleteMany({ where: { userId } })
  }

  private async recordQuery(query: string, userId: number | null): Promise<void> {
    try {
      await this.prisma.searchQuery.create({ data: { query, userId } })
      await this.cache?.del(cacheKeys.trending())
    } catch {
      // История поиска — не критичный путь, ошибку глотаем
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
      type: title.type as TitleCardDTO['type'],
      title: title.title,
      originalTitle: title.originalTitle,
      posterUrl: title.posterUrl,
      year: title.year,
      ratingKp: toNumber(title.ratingKp as { toNumber(): number } | number | null),
      genres: title.genres,
      status: title.status as TitleCardDTO['status'],
    }
  }
}
