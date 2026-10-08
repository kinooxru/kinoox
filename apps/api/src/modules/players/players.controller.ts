import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { notFound } from '../../core/types'
import { ok } from '../../utils'
import { balancerParamSchema, playerQuerySchema } from './players.schema'
import type { PlayersOrchestrator } from './players.service'

const idParamSchema = z.object({ id: z.coerce.number().int().positive() })

export interface PlayersControllerDeps {
  orchestrator: PlayersOrchestrator
  loadTitleRefs: (titleId: number) => Promise<{
    kpId: number | null
    imdbId: string | null
    titleId: number
  } | null>
}

/** GET /titles/:id/sources — все источники по приоритету */
export function makeGetSources(deps: PlayersControllerDeps) {
  return async function getSources(request: FastifyRequest, reply: FastifyReply) {
    const { id } = idParamSchema.parse(request.params)
    const query = playerQuerySchema.parse(request.query)

    const title = await deps.loadTitleRefs(id)
    if (!title) throw notFound('Тайтл не найден')

    const result = await deps.orchestrator.getSources(
      { kpId: title.kpId, imdbId: title.imdbId },
      {
        season: query.season,
        episode: query.episode,
        trailerOnly: query.trailer === 'only',
        trailer: query.trailer === true,
        sync: query.sync,
        poster: query.poster,
      },
    )

    return reply.send(ok({ titleId: id, ...result }))
  }
}

/** GET /titles/:id/sources/:balancer — источник конкретного балансера */
export function makeGetSourceByBalancer(deps: PlayersControllerDeps) {
  return async function getSourceByBalancer(request: FastifyRequest, reply: FastifyReply) {
    const { id } = idParamSchema.parse(request.params)
    const { balancer } = balancerParamSchema.parse(request.params)
    const query = playerQuerySchema.parse(request.query)

    const title = await deps.loadTitleRefs(id)
    if (!title) throw notFound('Тайтл не найден')

    const source = await deps.orchestrator.getSourceByBalancer(
      balancer,
      { kpId: title.kpId, imdbId: title.imdbId },
      {
        season: query.season,
        episode: query.episode,
        trailerOnly: query.trailer === 'only',
        trailer: query.trailer === true,
        sync: query.sync,
        poster: query.poster,
      },
    )

    if (!source) throw notFound(`Источник ${balancer} недоступен для этого тайтла`)
    return reply.send(ok(source))
  }
}

/** GET /players/balancers — состояние всех балансеров */
export function makeGetBalancers(deps: PlayersControllerDeps) {
  return async function getBalancers(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send(ok(deps.orchestrator.balancers))
  }
}

/**
 * Регистрация роутов модуля players.
 * Часть роутов живёт под /titles/:id, поэтому регистрируется здесь.
 */
export default async function playersRoutes(
  fastify: FastifyInstance,
  options: { deps: PlayersControllerDeps },
) {
  const { deps } = options

  fastify.get('/players/balancers', makeGetBalancers(deps))
  fastify.get('/titles/:id/sources', makeGetSources(deps))
  fastify.get('/titles/:id/sources/:balancer', makeGetSourceByBalancer(deps))
}
