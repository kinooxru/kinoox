import type { FastifyInstance } from 'fastify'
import playersRoutes, { type PlayersControllerDeps } from './players.controller'
import vibixEmbedRoutes from './vibix/vibix.embed.routes'

export interface PlayersRoutesOptions {
  deps: PlayersControllerDeps
}

/**
 * Регистрация роутов балансеров.
 *
 * GET /api/v1/titles/:id/sources
 * GET /api/v1/titles/:id/sources/:balancer
 * GET /api/v1/players/balancers
 * GET /api/v1/players/vibix/embed — HTML-обёртка плеера Vibix
 */
export default async function registerPlayersRoutes(
  fastify: FastifyInstance,
  options: PlayersRoutesOptions,
): Promise<void> {
  await playersRoutes(fastify, options)
  await fastify.register(vibixEmbedRoutes)
}

export { playersRoutes }
export type { PlayersControllerDeps }
