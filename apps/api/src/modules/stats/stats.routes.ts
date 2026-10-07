import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import type { SystemStatsDTO } from '@kinoox/api-client'
import { cacheKeys } from '../../core/plugins/cache.plugin.js'
import { ok } from '../../utils.js'
import type { DownloadsService } from '../downloads/downloads.service.js'

export interface StatsRoutesDeps {
  downloadsService: DownloadsService
}

export default async function statsRoutes(
  fastify: FastifyInstance,
  options: { deps: StatsRoutesDeps },
): Promise<void> {
  const { downloadsService } = options.deps

  /**
   * GET /api/v1/stats
   * Возвращает реальную актуальную статистику из базы данных:
   * - titlesCount: точное число тайтлов
   * - usersCount: точное число пользователей
   * - averageRating: средний рейтинг (5-звёздочная шкала)
   * - downloadsCount: общее число скачиваний приложений
   */
  fastify.get('/stats', async (_request: FastifyRequest, reply: FastifyReply) => {
    const cached = await fastify.cache?.get<SystemStatsDTO>(cacheKeys.stats())
    if (cached) {
      return reply.send(ok(cached))
    }

    const [titlesCount, usersCount, avgRatingResult, totalDownloads] = await Promise.all([
      fastify.prisma.title.count(),
      fastify.prisma.user.count(),
      fastify.prisma.title.aggregate({
        _avg: { ratingKp: true },
        where: { ratingKp: { not: null } },
      }),
      downloadsService.getTotalDownloads(),
    ])

    const rawKp = avgRatingResult._avg.ratingKp ? Number(avgRatingResult._avg.ratingKp) : 0
    // Переводим рейтинг Кинопоиска (0-10) в 5-звёздочную шкалу (0.0 - 5.0)
    const averageRating = rawKp > 0 ? Number((rawKp / 2).toFixed(1)) : 0

    const stats: SystemStatsDTO = {
      titlesCount,
      usersCount,
      averageRating,
      downloadsCount: totalDownloads,
    }

    // Кэш на 30 секунд для снижения нагрузки на БД
    await fastify.cache?.set(cacheKeys.stats(), stats, 30)

    return reply.send(ok(stats))
  })
}
