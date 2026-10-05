/**
 * Бизнес-логика профиля и истории просмотров.
 */
import type { PrismaClient } from '@prisma/client'
import type {
  FilterOptionsDTO,
  PaginatedResponse,
  UserDTO,
  ViewHistoryDTO,
} from '@kinoox/api-client'
import { conflict, notFound } from '../../core/types'
import { paginated, toNumber } from '../../utils'

export class UsersService {
  constructor(private readonly prisma: PrismaClient) {}

  async getProfile(userId: number): Promise<UserDTO> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw notFound('Пользователь не найден')
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    }
  }

  async updateProfile(
    userId: number,
    input: { username?: string; avatarUrl?: string | null },
  ): Promise<UserDTO> {
    if (input.username) {
      const taken = await this.prisma.user.findFirst({
        where: { username: input.username, id: { not: userId } },
        select: { id: true },
      })
      if (taken) throw conflict('Такое имя пользователя уже занято')
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.username !== undefined ? { username: input.username } : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      },
    })

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    }
  }

  /** Записать факт просмотра: один тайтл — одна запись, время обновляется */
  async recordView(
    userId: number,
    input: { titleId: number; season?: number; episode?: number },
  ): Promise<ViewHistoryDTO> {
    const title = await this.prisma.title.findUnique({
      where: { id: input.titleId },
      select: { id: true, type: true, title: true, originalTitle: true, posterUrl: true, year: true, ratingKp: true, genres: true, status: true },
    })
    if (!title) throw notFound('Тайтл не найден')

    const entry = await this.prisma.viewHistory.upsert({
      where: { userId_titleId: { userId, titleId: input.titleId } },
      create: {
        userId,
        titleId: input.titleId,
        season: input.season ?? null,
        episode: input.episode ?? null,
      },
      update: {
        season: input.season ?? null,
        episode: input.episode ?? null,
        watchedAt: new Date(),
      },
    })

    return {
      id: entry.id,
      userId: entry.userId,
      titleId: entry.titleId,
      season: entry.season,
      episode: entry.episode,
      watchedAt: entry.watchedAt.toISOString(),
      title: {
        id: title.id,
        type: title.type,
        title: title.title,
        originalTitle: title.originalTitle,
        posterUrl: title.posterUrl,
        year: title.year,
        ratingKp: toNumber(title.ratingKp),
        genres: title.genres,
        status: title.status,
      },
    }
  }

  async getHistory(
    userId: number,
    page: number,
    perPage: number,
  ): Promise<PaginatedResponse<ViewHistoryDTO>> {
    const where = { userId }
    const [items, total] = await Promise.all([
      this.prisma.viewHistory.findMany({
        where,
        include: { title: { select: { id: true, type: true, title: true, originalTitle: true, posterUrl: true, year: true, ratingKp: true, genres: true, status: true } } },
        orderBy: { watchedAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.viewHistory.count({ where }),
    ])

    return paginated(
      items.map((entry) => ({
        id: entry.id,
        userId: entry.userId,
        titleId: entry.titleId,
        season: entry.season,
        episode: entry.episode,
        watchedAt: entry.watchedAt.toISOString(),
        title: {
          id: entry.title.id,
          type: entry.title.type,
          title: entry.title.title,
          originalTitle: entry.title.originalTitle,
          posterUrl: entry.title.posterUrl,
          year: entry.title.year,
          ratingKp: toNumber(entry.title.ratingKp),
          genres: entry.title.genres,
          status: entry.title.status,
        },
      })),
      page,
      perPage,
      total,
    )
  }

  async clearHistory(userId: number): Promise<void> {
    await this.prisma.viewHistory.deleteMany({ where: { userId } })
  }

  /** Фильтры каталога, доступные пользователю (жанры и годы из его истории) */
  async getPersonalFilters(userId: number): Promise<FilterOptionsDTO> {
    const history = await this.prisma.viewHistory.findMany({
      where: { userId },
      include: { title: { select: { genres: true, year: true } } },
      take: 200,
    })

    const genres = new Set<string>()
    const years = new Set<number>()
    for (const entry of history) {
      for (const genre of entry.title.genres) genres.add(genre)
      years.add(entry.title.year)
    }

    return {
      genres: [...genres].sort((a, b) => a.localeCompare(b, 'ru')),
      years: [...years].sort((a, b) => b - a),
      countries: [],
    }
  }
}
