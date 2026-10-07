/**
 * Плагин CORS. Разрешённые источники перечислены в CORS_ORIGINS.
 */
import cors from '@fastify/cors'
import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { config } from '../../config.js'

export default fp(
  async function corsPlugin(fastify: FastifyInstance) {
    await fastify.register(cors, {
      origin: (origin, callback) => {
        // Запросы без Origin (мобильные приложения, curl, healthcheck) разрешены
        if (!origin) return callback(null, true)
        if (config.server.corsOrigins.includes(origin)) return callback(null, true)
        // В разработке разрешаем локальные адреса
        if (config.isDevelopment && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true)
        }
        callback(null, false)
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Total-Pages'],
      maxAge: 86_400,
    })
  },
  { name: 'kinoox-cors' },
)
