/**
 * HTTP-обработчики модуля поиска.
 */
import type { FastifyReply, FastifyRequest } from 'fastify'
import { ok } from '../../utils.js'
import { searchQuerySchema, suggestQuerySchema, trendingQuerySchema } from './search.schema.js'
import type { SearchService } from './search.service.js'

export interface SearchControllerDeps {
  searchService: SearchService
}

/** GET /search */
export function makeSearch(deps: SearchControllerDeps) {
  return async function search(request: FastifyRequest, reply: FastifyReply) {
    const input = searchQuerySchema.parse(request.query)
    const result = await deps.searchService.search(input.q, {
      type: input.type,
      page: input.page,
      perPage: input.perPage,
      userId: request.currentUser?.sub ?? null,
    })

    reply.header('X-Page', String(result.meta.page))
    reply.header('X-Total-Count', String(result.meta.total))
    reply.header('X-Total-Pages', String(result.meta.totalPages))

    return reply.send(ok(result))
  }
}

/** GET /search/suggest */
export function makeSuggest(deps: SearchControllerDeps) {
  return async function suggest(request: FastifyRequest, reply: FastifyReply) {
    const input = suggestQuerySchema.parse(request.query)
    const items = await deps.searchService.suggest(input.q, input.limit)
    return reply.send(ok(items))
  }
}

/** GET /search/trending */
export function makeTrending(deps: SearchControllerDeps) {
  return async function trending(request: FastifyRequest, reply: FastifyReply) {
    const input = trendingQuerySchema.parse(request.query)
    const items = await deps.searchService.trending(input.limit)
    return reply.send(ok(items))
  }
}

/** GET /search/history */
export function makeSearchHistory(deps: SearchControllerDeps) {
  return async function searchHistory(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.currentUser?.sub
    if (!userId) return reply.send(ok([]))
    const items = await deps.searchService.getHistory(userId)
    return reply.send(ok(items))
  }
}

/** DELETE /search/history */
export function makeClearSearchHistory(deps: SearchControllerDeps) {
  return async function clearSearchHistory(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.currentUser?.sub
    if (userId) await deps.searchService.clearHistory(userId)
    return reply.send(ok({ success: true }))
  }
}
