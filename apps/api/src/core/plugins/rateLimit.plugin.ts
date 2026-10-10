/**
 * Плагин rate-limit: защита от перебора паролей и скрейпинга каталога.
 */
import rateLimit from '@fastify/rate-limit'
import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { config } from '../../config'

export default fp(
  async function rateLimitPlugin(fastify: FastifyInstance) {
    await fastify.register(rateLimit, {
      global: true,
      max: config.rateLimit.max,
      timeWindow: config.rateLimit.window,
      allowList: (request) => request.url === '/api/health',
      keyGenerator: (request) => {
        // Для авторизованных считаем лимит по пользователю, иначе — по IP
        const user = request.currentUser
        if (user?.sub) return `user:${user.sub}`
        return request.ip
      },
      errorResponseBuilder: (_request, context) => ({
        success: false,
        data: null,
        error: `Слишком много запросов. Повторите через ${Math.ceil(Number(context.ttl) / 1000)} с.`,
      }),
      addHeadersOnExceeding: {
        'x-ratelimit-limit': true,
        'x-ratelimit-remaining': true,
        'x-ratelimit-reset': true,
      },
      addHeaders: {
        'x-ratelimit-limit': true,
        'x-ratelimit-remaining': true,
        'x-ratelimit-reset': true,
        'retry-after': true,
      },
    })
  },
  { name: 'kinoox-rate-limit' },
)
