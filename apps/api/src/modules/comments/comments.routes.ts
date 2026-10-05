import type { FastifyInstance } from 'fastify'
import {
  makeCreateComment,
  makeDeleteComment,
  makeGetComments,
  makeLikeComment,
  type CommentsControllerDeps,
} from './comments.controller'

export interface CommentsRoutesOptions {
  deps: CommentsControllerDeps
}

/**
 * Роуты комментариев.
 *
 * GET    /api/v1/titles/:id/comments        — чтение доступно всем
 * POST   /api/v1/titles/:id/comments        — требуется авторизация
 * DELETE /api/v1/comments/:id               — автор или админ
 * POST   /api/v1/comments/:id/like
 */
export default async function commentsRoutes(
  fastify: FastifyInstance,
  options: CommentsRoutesOptions,
): Promise<void> {
  const { deps } = options

  fastify.get('/titles/:id/comments', makeGetComments(deps))
  fastify.post(
    '/titles/:id/comments',
    {
      preHandler: [fastify.authenticate],
      // Комментарии пишутся чаще остальных запросов — отдельный лимит
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    makeCreateComment(deps),
  )
  fastify.delete('/comments/:id', { preHandler: [fastify.authenticate] }, makeDeleteComment(deps))
  fastify.post('/comments/:id/like', makeLikeComment(deps))
}
