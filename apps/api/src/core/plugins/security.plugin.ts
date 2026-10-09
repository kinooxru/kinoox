/**
 * Плагин безопасности: заголовки Helmet.
 */
import helmet from '@fastify/helmet'
import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { config } from '../../config.js'

export default fp(
  async function securityPlugin(fastify: FastifyInstance) {
    await fastify.register(helmet, {
      // API отдаёт JSON и картинки — CSP выставляется на стороне Nginx
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
      // X-Frame-Options: SAMEORIGIN блокировал плеер в iframe: сайт (:3000) и API (:3001) —
      // разные origin. API отдаёт JSON, кликджекинг ему не грозит, а для HTML-обёртки
      // плеера выставляется точный CSP frame-ancestors (см. vibix.embed.routes.ts).
      frameguard: false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hsts: config.isProduction
        ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
        : false,
    })
  },
  { name: 'kinoox-security' },
)
