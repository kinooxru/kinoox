/**
 * Healthcheck для Docker и мониторинга.
 *
 * GET /api/health — общий статус сервиса.
 * Используется healthcheck'ом контейнера kinoox-api, Prometheus и Nginx.
 */
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import type { HealthDTO } from '@kinoox/api-client'
import { config } from '../../config.js'
import { ok } from '../../utils'

const startedAt = Date.now()

export default async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/health', async (_request: FastifyRequest, reply: FastifyReply) => {
    let database: 'up' | 'down' = 'down'
    let redis: 'up' | 'down' = 'down'

    try {
      await fastify.prisma.$queryRaw`SELECT 1`
      database = 'up'
    } catch {
      database = 'down'
    }

    try {
      const pong = await fastify.redis.ping()
      redis = pong === 'PONG' ? 'up' : 'down'
    } catch {
      redis = 'down'
    }

    const healthy = database === 'up'

    const payload: HealthDTO = {
      // Redis не критичен: без кэша API продолжает обслуживать запросы
      status: healthy ? 'ok' : 'degraded',
      uptime: Math.round((Date.now() - startedAt) / 1000),
      version: '1.0.0',
      services: { database, redis },
      timestamp: new Date().toISOString(),
    }

    return reply.code(healthy ? 200 : 503).send(ok(payload))
  })

  // Короткий ответ для Docker HEALTHCHECK — без обращения к БД
  fastify.get('/health/live', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(200).send({ status: 'ok', env: config.env })
  })
}
