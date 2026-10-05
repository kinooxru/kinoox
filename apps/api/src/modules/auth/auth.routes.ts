import type { FastifyInstance } from 'fastify'
import {
  makeLogin,
  makeLogout,
  makeRefresh,
  makeRegister,
  type AuthControllerDeps,
} from './auth.controller'

export interface AuthRoutesOptions {
  deps: AuthControllerDeps
}

/**
 * Роуты авторизации.
 *
 * POST /api/v1/auth/register
 * POST /api/v1/auth/login
 * POST /api/v1/auth/refresh
 * POST /api/v1/auth/logout
 *
 * На вход и регистрацию навешен отдельный, более строгий лимит запросов.
 */
export default async function authRoutes(
  fastify: FastifyInstance,
  options: AuthRoutesOptions,
): Promise<void> {
  const { deps } = options

  // Защита от перебора паролей: 10 попыток за 5 минут на IP
  const strictRateLimit = {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '5 minutes',
      },
    },
  }

  fastify.post('/auth/register', strictRateLimit, makeRegister(deps))
  fastify.post('/auth/login', strictRateLimit, makeLogin(deps))
  fastify.post('/auth/refresh', makeRefresh(deps))
  fastify.post('/auth/logout', { preHandler: [fastify.authenticate] }, makeLogout(deps))
}
