/**
 * Тонкие HTTP-обработчики каталога: валидация → сервис → ответ.
 */
import type { FastifyReply, FastifyRequest } from 'fastify'
import { ok, paginated } from '../../utils.js'
import { relatedQuerySchema, titleFilterSchema, titleIdParamSchema, upsertTitleSchema } from './titles.schema.js'
import type { TitlesService } from './titles.service.js'

export interface TitlesControllerDeps {
  titlesService: TitlesService
  onView?: (titleId: number) => Promise<void>
}

/** GET /titles */
export function makeGetTitles(deps: TitlesControllerDeps) {
  return async function getTitles(request: FastifyRequest, reply: FastifyReply) {
    const filter = titleFilterSchema.parse(request.query)
    const result = await deps.titlesService.getList({
      type: filter.type,
      genre: filter.genre,
      country: filter.country,
      year: filter.year,
      minRating: filter.minRating,
      sort: filter.sort,
      page: filter.page,
      perPage: filter.perPage,
    })

    reply.header('X-Page', String(result.meta.page))
    reply.header('X-Total-Count', String(result.meta.total))
    reply.header('X-Total-Pages', String(result.meta.totalPages))

    return reply.send(ok(result))
  }
}

/** GET /titles/:id */
export function makeGetTitle(deps: TitlesControllerDeps) {
  return async function getTitle(request: FastifyRequest, reply: FastifyReply) {
    const { id } = titleIdParamSchema.parse(request.params)
    const title = await deps.titlesService.getById(id)
    await deps.onView?.(id)
    return reply.send(ok(title))
  }
}

/** GET /titles/:id/episodes */
export function makeGetEpisodes(deps: TitlesControllerDeps) {
  return async function getEpisodes(request: FastifyRequest, reply: FastifyReply) {
    const { id } = titleIdParamSchema.parse(request.params)
    const episodes = await deps.titlesService.getEpisodes(id)
    return reply.send(ok(episodes))
  }
}

/** GET /titles/:id/source-records */
export function makeGetSourceRecords(deps: TitlesControllerDeps) {
  return async function getSourceRecords(request: FastifyRequest, reply: FastifyReply) {
    const { id } = titleIdParamSchema.parse(request.params)
    const sources = await deps.titlesService.getSourceRecords(id)
    return reply.send(ok(sources))
  }
}

/** GET /titles/:id/related */
export function makeGetRelated(deps: TitlesControllerDeps) {
  return async function getRelated(request: FastifyRequest, reply: FastifyReply) {
    const { id } = titleIdParamSchema.parse(request.params)
    const { limit } = relatedQuerySchema.parse(request.query)
    const items = await deps.titlesService.getRelated(id, limit)
    return reply.send(ok(paginated(items, 1, limit, items.length)))
  }
}

/** GET /titles/:id/similar */
export function makeGetSimilar(deps: TitlesControllerDeps) {
  return async function getSimilar(request: FastifyRequest, reply: FastifyReply) {
    const { id } = titleIdParamSchema.parse(request.params)
    const { limit } = relatedQuerySchema.parse(request.query)
    const items = await deps.titlesService.getSimilar(id, limit)
    return reply.send(ok(paginated(items, 1, limit, items.length)))
  }
}

/** GET /filters */
export function makeGetFilters(deps: TitlesControllerDeps) {
  return async function getFilters(_request: FastifyRequest, reply: FastifyReply) {
    const filters = await deps.titlesService.getFilters()
    return reply.send(ok(filters))
  }
}

/** GET /collections — подборки главной страницы */
export function makeGetCollections(deps: TitlesControllerDeps) {
  return async function getCollections(_request: FastifyRequest, reply: FastifyReply) {
    const collections = await deps.titlesService.getCollections()
    return reply.send(ok(collections))
  }
}

/** POST /admin/titles — создание/обновление тайтла (только админ) */
export function makeUpsertTitle(deps: TitlesControllerDeps) {
  return async function upsertTitle(request: FastifyRequest, reply: FastifyReply) {
    const input = upsertTitleSchema.parse(request.body)
    const titleId = await deps.titlesService.upsertByExternalId({
      ...input,
      kpId: input.kpId ?? null,
      imdbId: input.imdbId ?? null,
    })
    const title = await deps.titlesService.getById(titleId)
    return reply.code(201).send(ok(title))
  }
}
