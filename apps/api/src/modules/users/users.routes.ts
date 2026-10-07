import type { FastifyInstance } from 'fastify'
import {
  makeAddHistory,
  makeClearHistory,
  makeGetHistory,
  makeGetPersonalFilters,
  makeGetProfile,
  makeUpdateProfile,
  type UsersControllerDeps,
} from './users.controller.js'

export interface UsersRoutesOptions {
  deps: UsersControllerDeps
}

/**
 * Роуты профиля — все требуют авторизации.
 *
 * GET    /api/v1/user/profile
 * PATCH  /api/v1/user/profile
 * GET    /api/v1/user/history
 * POST   /api/v1/user/history
 * DELETE /api/v1/user/history
 * GET    /api/v1/user/filters
 */
export default async function usersRoutes(
  fastify: FastifyInstance,
  options: UsersRoutesOptions,
): Promise<void> {
  const { deps } = options
  const auth = { preHandler: [fastify.authenticate] }

  fastify.get('/user/profile', auth, makeGetProfile(deps))
  fastify.patch('/user/profile', auth, makeUpdateProfile(deps))
  fastify.get('/user/history', auth, makeGetHistory(deps))
  fastify.post('/user/history', auth, makeAddHistory(deps))
  fastify.delete('/user/history', auth, makeClearHistory(deps))
  fastify.get('/user/filters', auth, makeGetPersonalFilters(deps))
}
