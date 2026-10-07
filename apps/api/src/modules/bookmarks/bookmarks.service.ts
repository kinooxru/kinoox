/**
 * Бизнес-логика закладок. Закладки синхронизируются между всеми устройствами
 * пользователя, потому что живут только на сервере.
 */
import type { PrismaClient } from '@prisma/client'
import type { BookmarkDTO, BookmarkStatus, PaginatedResponse } from '@kinoox/api-client'
import { notFound } from '../../core/types.js'
import { paginated, toNumber } from '../../utils.js'

const TITLE_CARD_SELECT = {
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

export interface BookmarkRow {
  id: number
  userId: number
  titleId: number
  status: BookmarkStatus
  lastSeason: number | null
  lastEpisode: number | null
  createdAt: Date
  title: {
    id: number
    type: string
    title: string
    originalTitle: string | null
    posterUrl: string
    year: number
    ratingKp: unknown
    genres: string[]
    status: string
  }
}

export class BookmarksService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(
    userId: number,
    options: { status?: BookmarkStatus; page: number; perPage: number },
  ): Promise<PaginatedResponse<BookmarkDTO>> {
    const where = { userId, ...(options.status ? { status: options.status } : {}) }

    const [items, total] = await Promise.all([
      this.prisma.bookmark.findMany({
        where,
        include: { title: { select: TITLE_CARD_SELECT } },
        orderBy: { updatedAt: 'desc' },
        skip: (options.page - 1) * options.perPage,
        take: options.perPage,
      }),
      this.prisma.bookmark.count({ where }),
    ])

    return paginated(items.map((item) => this.toDto(item as BookmarkRow)), options.page, options.perPage, total)
  }

  /** Добавить или обновить закладку — идемпотентно */
  async upsert(
    userId: number,
    input: {
      titleId: number
      status: BookmarkStatus
      lastSeason?: number
      lastEpisode?: number
    },
  ): Promise<BookmarkDTO> {
    const titleExists = await this.prisma.title.findUnique({
      where: { id: input.titleId },
      select: { id: true },
    })
    if (!titleExists) throw notFound('Тайтл не найден')

    const bookmark = await this.prisma.bookmark.upsert({
      where: { userId_titleId: { userId, titleId: input.titleId } },
      create: {
        userId,
        titleId: input.titleId,
        status: input.status,
        lastSeason: input.lastSeason ?? null,
        lastEpisode: input.lastEpisode ?? null,
      },
      update: {
        status: input.status,
        ...(input.lastSeason !== undefined ? { lastSeason: input.lastSeason } : {}),
        ...(input.lastEpisode !== undefined ? { lastEpisode: input.lastEpisode } : {}),
      },
      include: { title: { select: TITLE_CARD_SELECT } },
    })

    return this.toDto(bookmark as BookmarkRow)
  }

  async update(
    userId: number,
    titleId: number,
    input: {
      status?: BookmarkStatus
      lastSeason?: number | null
      lastEpisode?: number | null
    },
  ): Promise<BookmarkDTO> {
    const existing = await this.prisma.bookmark.findUnique({
      where: { userId_titleId: { userId, titleId } },
      select: { id: true },
    })
    if (!existing) throw notFound('Закладка не найдена')

    const bookmark = await this.prisma.bookmark.update({
      where: { userId_titleId: { userId, titleId } },
      data: {
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.lastSeason !== undefined ? { lastSeason: input.lastSeason } : {}),
        ...(input.lastEpisode !== undefined ? { lastEpisode: input.lastEpisode } : {}),
      },
      include: { title: { select: TITLE_CARD_SELECT } },
    })

    return this.toDto(bookmark as BookmarkRow)
  }

  async remove(userId: number, titleId: number): Promise<void> {
    const existing = await this.prisma.bookmark.findUnique({
      where: { userId_titleId: { userId, titleId } },
      select: { id: true },
    })
    if (!existing) throw notFound('Закладка не найдена')

    await this.prisma.bookmark.delete({ where: { userId_titleId: { userId, titleId } } })
  }

  /** Статус закладки конкретного тайтла — для иконки «сердце» в интерфейсе */
  async getStatus(
    userId: number,
    titleId: number,
  ): Promise<{ bookmarked: boolean; status: BookmarkStatus | null }> {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: { userId_titleId: { userId, titleId } },
      select: { status: true },
    })

    return {
      bookmarked: Boolean(bookmark),
      status: bookmark?.status ?? null,
    }
  }

  /** Сводка по статусам — для экрана «Закладки» */
  async getCounters(userId: number): Promise<Record<BookmarkStatus, number>> {
    const grouped = await this.prisma.bookmark.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true },
    })

    const counters: Record<BookmarkStatus, number> = {
      watching: 0,
      planned: 0,
      completed: 0,
      dropped: 0,
      on_hold: 0,
    }

    for (const row of grouped) {
      counters[row.status] = row._count._all
    }

    return counters
  }

  private toDto(bookmark: BookmarkRow): BookmarkDTO {
    return {
      id: bookmark.id,
      userId: bookmark.userId,
      titleId: bookmark.titleId,
      status: bookmark.status,
      lastSeason: bookmark.lastSeason,
      lastEpisode: bookmark.lastEpisode,
      createdAt: bookmark.createdAt.toISOString(),
      title: {
        id: bookmark.title.id,
        type: bookmark.title.type as BookmarkDTO['title']['type'],
        title: bookmark.title.title,
        originalTitle: bookmark.title.originalTitle,
        posterUrl: bookmark.title.posterUrl,
        year: bookmark.title.year,
        ratingKp: toNumber(bookmark.title.ratingKp as { toNumber(): number } | number | null),
        genres: bookmark.title.genres,
        status: bookmark.title.status as BookmarkDTO['title']['status'],
      },
    }
  }
}
