import type { FastifyInstance } from 'fastify'
import {
  makeClearSearchHistory,
  makeSearch,
  makeSearchHistory,
  makeSuggest,
  makeTrending,
  type SearchControllerDeps,
} from './search.controller'

export interface SearchRoutesOptions {
  deps: SearchControllerDeps
}

/**
 * Роуты поиска.
 *
 * GET    /api/v1/search
 * GET    /api/v1/search/suggest
 * GET    /api/v1/search/trending
 * GET    /api/v1/search/history   — требуется авторизация
 * DELETE /api/v1/search/history   — требуется авторизация
 */
export default async function searchRoutes(
  fastify: FastifyInstance,
  options: SearchRoutesOptions,
): Promise<void> {
  const { deps } = options

  fastify.get('/search', { preHandler: [fastify.optionalAuth] }, makeSearch(deps))
  fastify.get('/search/suggest', makeSuggest(deps))
  fastify.get('/search/trending', makeTrending(deps))
  fastify.get(
    '/search/history',
    { preHandler: [fastify.authenticate] },
    makeSearchHistory(deps),
  )
  fastify.delete(
    '/search/history',
    { preHandler: [fastify.authenticate] },
    makeClearSearchHistory(deps),
  )
}
