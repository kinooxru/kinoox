/**
 * Сборка приложения Fastify.
 *
 * Порядок регистрации важен:
 *   1. плагины ядра (безопасность, CORS, кэш, БД, JWT, лимиты, ошибки);
 *   2. декораторы авторизации;
 *   3. роуты модулей под префиксом /api/v1;
 *   4. healthcheck под /api.
 */
import Fastify, { type FastifyInstance } from 'fastify'
import { config } from './config'
import { loggerOptions } from './core/logger'
import cachePlugin from './core/plugins/cache.plugin'
import corsPlugin from './core/plugins/cors.plugin'
import errorPlugin from './core/plugins/error.plugin'
import jwtPlugin from './core/plugins/jwt.plugin'
import prismaPlugin from './core/plugins/prisma.plugin'
import rateLimitPlugin from './core/plugins/rateLimit.plugin'
import securityPlugin from './core/plugins/security.plugin'
import { registerAuthDecorators } from './core/middleware/auth.middleware'
import type { JwtPayload } from './core/plugins/jwt.plugin'

import healthRoutes from './modules/health/health.routes'
import authRoutes from './modules/auth/auth.routes'
import { AuthService } from './modules/auth/auth.service'
import usersRoutes from './modules/users/users.routes'
import { UsersService } from './modules/users/users.service'
import titlesRoutes from './modules/titles/titles.routes'
import { TitlesService } from './modules/titles/titles.service'
import bookmarksRoutes from './modules/bookmarks/bookmarks.routes'
import { BookmarksService } from './modules/bookmarks/bookmarks.service'
import commentsRoutes from './modules/comments/comments.routes'
import { CommentsService } from './modules/comments/comments.service'
import searchRoutes from './modules/search/search.routes'
import { SearchService } from './modules/search/search.service'
import playersRoutes from './modules/players/players.routes'
import { PlayersOrchestrator } from './modules/players/players.service'
import { CatalogSyncService } from './modules/sync/catalog.sync.service'
import syncRoutes from './modules/sync/sync.routes'
import downloadsRoutes from './modules/downloads/downloads.routes'
import qrRoutes from './modules/downloads/qr.routes'
import { DownloadsService } from './modules/downloads/downloads.service'
import notificationsRoutes from './modules/notifications/notifications.routes'
import { NotificationsService } from './modules/notifications/notifications.service'
import statsRoutes from './modules/stats/stats.routes'
import downloadFileRoutes from './modules/downloads/download-file.routes'

export interface BuildServerOptions {
  /** Socket.io-сервер подключается после создания HTTP-сервера */
  getSocketServer?: () => import('socket.io').Server | null
}

export async function buildServer(options: BuildServerOptions = {}): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: loggerOptions,
    trustProxy: true,
    bodyLimit: 2 * 1024 * 1024,
    disableRequestLogging: config.isProduction,
    genReqId: () => crypto.randomUUID(),
  })

  // ── Плагины ядра ─────────────────────────────────────────
  await fastify.register(securityPlugin)
  await fastify.register(corsPlugin)
  await fastify.register(prismaPlugin)
  await fastify.register(cachePlugin)
  await fastify.register(jwtPlugin)
  await fastify.register(rateLimitPlugin)
  await fastify.register(errorPlugin)

  // ── Декораторы авторизации ───────────────────────────────
  registerAuthDecorators(fastify)

  // ── Сервисы ──────────────────────────────────────────────
  const signer = {
    signAccess: (payload: Omit<JwtPayload, 'type'>) =>
      fastify.jwt.access.sign({ ...payload, type: 'access' }),
    signRefresh: (payload: Omit<JwtPayload, 'type'>) =>
      fastify.jwt.refresh.sign({ ...payload, type: 'refresh' }),
  }

  const authService = new AuthService(fastify.prisma, signer).withRefreshVerifier(async (token) =>
    fastify.jwt.refresh.verify<JwtPayload>(token),
  )

  const titlesService = new TitlesService(fastify.prisma, fastify.cache)
  const usersService = new UsersService(fastify.prisma)
  const bookmarksService = new BookmarksService(fastify.prisma)
  const commentsService = new CommentsService(fastify.prisma)
  const searchService = new SearchService(fastify.prisma, fastify.cache)
  const downloadsService = new DownloadsService(fastify.prisma, fastify.cache)
  const playersOrchestrator = new PlayersOrchestrator(fastify.cache)
  const catalogSyncService = new CatalogSyncService(fastify.prisma, fastify.cache)

  const notificationsService = new NotificationsService({
    getSocketServer: options.getSocketServer ?? (() => null),
  })

  // ── Роуты модулей ────────────────────────────────────────
  await fastify.register(
    async (api) => {
      await api.register(authRoutes, { deps: { authService } })
      await api.register(usersRoutes, { deps: { usersService } })
      await api.register(titlesRoutes, {
        deps: {
          titlesService,
          onView: async (titleId: number) => {
            await titlesService.incrementViews(titleId)
          },
        },
      })
      await api.register(bookmarksRoutes, { deps: { bookmarksService } })
      await api.register(commentsRoutes, { deps: { commentsService } })
      await api.register(searchRoutes, { deps: { searchService } })
      await api.register(playersRoutes, {
        deps: {
          orchestrator: playersOrchestrator,
          loadTitleRefs: async (titleId: number) => {
            const refs = await titlesService.getTitleRefs(titleId)
            if (!refs) return null
            return { titleId: refs.titleId, kpId: refs.kpId, imdbId: refs.imdbId }
          },
        },
      })
      await api.register(syncRoutes, {
        deps: {
          syncService: catalogSyncService,
          loadTitleRefs: async (titleId: number) => {
            const refs = await titlesService.getTitleRefs(titleId)
            if (!refs) return null
            return { titleId: refs.titleId, kpId: refs.kpId }
          },
        },
      })
      await api.register(downloadsRoutes, { deps: { downloadsService } })
      await api.register(notificationsRoutes, { deps: { notificationsService } })
      await api.register(statsRoutes, { deps: { downloadsService } })
    },
    { prefix: '/api/v1' },
  )

  // Healthcheck и QR-коды живут под /api
  await fastify.register(healthRoutes, { prefix: '/api' })
  await fastify.register(qrRoutes, { prefix: '/api' })

  // Прямая раздача файлов приложений (APK, EXE, DMG и т.д.)
  await fastify.register(downloadFileRoutes, { deps: { downloadsService } })

  // Доступ к сервисам для других частей приложения (Socket.io, задачи синхронизации)
  fastify.decorate('services', {
    authService,
    titlesService,
    usersService,
    bookmarksService,
    commentsService,
    searchService,
    downloadsService,
    playersOrchestrator,
    catalogSyncService,
    notificationsService,
  })

  return fastify
}

declare module 'fastify' {
  interface FastifyInstance {
    services: {
      authService: AuthService
      titlesService: TitlesService
      usersService: UsersService
      bookmarksService: BookmarksService
      commentsService: CommentsService
      searchService: SearchService
      downloadsService: DownloadsService
      playersOrchestrator: PlayersOrchestrator
      notificationsService: NotificationsService
    }
  }
}
