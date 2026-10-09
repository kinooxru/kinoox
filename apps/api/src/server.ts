/**
 * Точка входа API.
 *
 * Поднимает Fastify, навешивает Socket.io на тот же HTTP-сервер,
 * обрабатывает сигналы завершения для корректного graceful shutdown.
 */
import { buildServer } from './app.js'
import { config } from './config.js'
import { createSocketServer } from './realtime/socket.js'

async function main(): Promise<void> {
  let socketServer: ReturnType<typeof createSocketServer> | null = null

  const fastify = await buildServer({
    getSocketServer: () => socketServer,
  })

  socketServer = createSocketServer(fastify)

  // ── Graceful shutdown ────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    fastify.log.info({ signal }, 'Получен сигнал завершения — останавливаем сервер')
    try {
      await socketServer?.close()
      await fastify.close()
      fastify.log.info('Сервер остановлен корректно')
      process.exit(0)
    } catch (error) {
      fastify.log.error({ err: error }, 'Ошибка при остановке сервера')
      process.exit(1)
    }
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('SIGINT', () => void shutdown('SIGINT'))

  process.on('unhandledRejection', (reason) => {
    fastify.log.error({ err: reason }, 'Необработанный отказ промиса')
  })

  process.on('uncaughtException', (error) => {
    fastify.log.fatal({ err: error }, 'Необработанное исключение — процесс будет остановлен')
    void shutdown('uncaughtException')
  })

  try {
    await fastify.listen({ port: config.server.port, host: config.server.host })
    fastify.log.info(
      {
        env: config.env,
        playersMode: config.players.mode,
        cors: config.server.corsOrigins,
      },
      `KINOOX API запущен на http://${config.server.host}:${config.server.port}`,
    )

    // Автоматическая синхронизация каталога, постеров и серий из видеобалансеров
    const syncService = (
      fastify as unknown as {
        services?: {
          catalogSyncService?: import('./modules/sync/catalog.sync.service').CatalogSyncService
        }
      }
    ).services?.catalogSyncService

    if (syncService) {
      // 1. Быстрая актуализация текущего каталога (постеры, описания, серии)
      setTimeout(() => {
        fastify.log.info('Запуск автоматической актуализации постеров и данных каталога...')
        syncService
          .syncAllExistingTitles()
          .then((res) => {
            fastify.log.info({ count: res.length }, 'Актуализация существующих тайтлов завершена')
          })
          .catch((err) => {
            fastify.log.warn({ err }, 'Ошибка актуализации каталога')
          })
      }, 2000)

      // 2. Автоматический импорт свежих поступлений из балансеров (фильмы, сериалы, мультфильмы, аниме)
      setTimeout(() => {
        fastify.log.info('Запуск автоматического импорта новинок из балансеров...')
        syncService
          .importLatestFromBalancers({ veoveoPages: 2, vibixLimit: 40 })
          .then((res) => {
            fastify.log.info({ imported: res.imported }, 'Автоматический импорт новинок завершён')
          })
          .catch((err) => {
            fastify.log.warn({ err }, 'Ошибка импорта новинок из балансеров')
          })
      }, 8000)

      // 3. Периодическая проверка выходящих сериалов и аниме (онгоингов) каждый час
      setInterval(() => {
        syncService
          .syncOngoingTitles()
          .catch((err) => {
            fastify.log.warn({ err }, 'Ошибка периодической синхронизации онгоингов')
          })
      }, 60 * 60 * 1000)

      // 4. Периодический опрос и пополнение каталога новинками каждые 2 часа
      setInterval(() => {
        syncService
          .importLatestFromBalancers({ veoveoPages: 2, vibixLimit: 40 })
          .catch((err) => {
            fastify.log.warn({ err }, 'Ошибка периодического импорта новинок')
          })
      }, 2 * 60 * 60 * 1000)
    }
  } catch (error) {
    fastify.log.fatal({ err: error }, 'Не удалось запустить сервер')
    process.exit(1)
  }
}

void main()
