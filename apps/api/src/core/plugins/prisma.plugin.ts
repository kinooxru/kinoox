/**
 * Плагин Prisma: единый экземпляр клиента на всё приложение.
 */
import { PrismaClient } from '@prisma/client'
import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { config } from '../../config'

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
  }
}

export default fp(
  async function prismaPlugin(fastify: FastifyInstance) {
    const prisma = new PrismaClient({
      datasources: config.database.url ? { db: { url: config.database.url } } : undefined,
      log: config.isProduction
        ? [{ emit: 'event', level: 'error' }]
        : [
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'query' },
          ],
    })

    prisma.$on('error' as never, (event: unknown) => {
      fastify.log.error({ prisma: event }, 'Ошибка Prisma')
    })

    if (config.isDevelopment) {
      prisma.$on('warn' as never, (event: unknown) => {
        fastify.log.warn({ prisma: event }, 'Предупреждение Prisma')
      })
      prisma.$on('query' as never, (event: { query?: string; duration?: number }) => {
        if (typeof event.duration === 'number' && event.duration >= 200) {
          fastify.log.warn(
            { query: event.query, durationMs: event.duration },
            'Медленный запрос Prisma',
          )
        }
      })
    }

    try {
      await prisma.$connect()
      fastify.log.info('PostgreSQL подключён')
    } catch (error) {
      fastify.log.error({ err: error }, 'Не удалось подключиться к PostgreSQL')
      throw error
    }

    fastify.decorate('prisma', prisma)

    fastify.addHook('onClose', async () => {
      await prisma.$disconnect()
    })
  },
  { name: 'kinoox-prisma' },
)
