import type { FastifyInstance } from 'fastify'
import {
  makeGetCollections,
  makeGetEpisodes,
  makeGetFilters,
  makeGetRelated,
  makeGetSimilar,
  makeGetSourceRecords,
  makeGetTitle,
  makeGetTitles,
  makeUpsertTitle,
  type TitlesControllerDeps,
} from './titles.controller'

export interface TitlesRoutesOptions {
  deps: TitlesControllerDeps
}

/**
 * Роуты каталога.
 *
 * Public:
 *   GET  /api/v1/titles
 *   GET  /api/v1/titles/:id
 *   GET  /api/v1/titles/:id/episodes
 *   GET  /api/v1/titles/:id/source-records
 *   GET  /api/v1/titles/:id/related
 *   GET  /api/v1/titles/:id/similar
 *   GET  /api/v1/filters
 *   GET  /api/v1/collections
 *
 * Admin:
 *   POST /api/v1/admin/titles
 */
export default async function titlesRoutes(
  fastify: FastifyInstance,
  options: TitlesRoutesOptions,
): Promise<void> {
  const { deps } = options

  fastify.get('/titles', { preHandler: [fastify.optionalAuth] }, makeGetTitles(deps))
  fastify.get('/titles/:id', { preHandler: [fastify.optionalAuth] }, makeGetTitle(deps))
  fastify.get('/titles/:id/episodes', makeGetEpisodes(deps))
  fastify.get('/titles/:id/source-records', makeGetSourceRecords(deps))
  fastify.get('/titles/:id/related', makeGetRelated(deps))
  fastify.get('/titles/:id/similar', makeGetSimilar(deps))
  fastify.get('/filters', makeGetFilters(deps))
  fastify.get('/collections', makeGetCollections(deps))

  fastify.post('/admin/titles', { preHandler: [fastify.requireAdmin] }, makeUpsertTitle(deps))
}
