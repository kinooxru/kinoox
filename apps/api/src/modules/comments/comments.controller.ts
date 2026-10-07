/**
 * HTTP-обработчики модуля комментариев.
 */
import type { FastifyReply, FastifyRequest } from 'fastify'
import { requireUser } from '../../core/middleware/auth.middleware.js'
import { ok } from '../../utils.js'
import {
  commentIdParamSchema,
  commentsQuerySchema,
  createCommentSchema,
  titleCommentsParamSchema,
} from './comments.schema.js'
import type { CommentsService } from './comments.service.js'

export interface CommentsControllerDeps {
  commentsService: CommentsService
}

/** GET /titles/:id/comments */
export function makeGetComments(deps: CommentsControllerDeps) {
  return async function getComments(request: FastifyRequest, reply: FastifyReply) {
    const { id } = titleCommentsParamSchema.parse(request.params)
    const { page, perPage } = commentsQuerySchema.parse(request.query)
    const result = await deps.commentsService.listByTitle(id, page, perPage)
    return reply.send(ok(result))
  }
}

/** POST /titles/:id/comments */
export function makeCreateComment(deps: CommentsControllerDeps) {
  return async function createComment(request: FastifyRequest, reply: FastifyReply) {
    const user = requireUser(request)
    const { id } = titleCommentsParamSchema.parse(request.params)
    const input = createCommentSchema.parse(request.body)
    const comment = await deps.commentsService.create(id, user.sub, input)
    return reply.code(201).send(ok(comment))
  }
}

/** DELETE /comments/:id */
export function makeDeleteComment(deps: CommentsControllerDeps) {
  return async function deleteComment(request: FastifyRequest, reply: FastifyReply) {
    const user = requireUser(request)
    const { id } = commentIdParamSchema.parse(request.params)
    await deps.commentsService.remove(id, user.sub, request.isAdmin)
    return reply.send(ok({ success: true }))
  }
}

/** POST /comments/:id/like */
export function makeLikeComment(deps: CommentsControllerDeps) {
  return async function likeComment(request: FastifyRequest, reply: FastifyReply) {
    const { id } = commentIdParamSchema.parse(request.params)
    const result = await deps.commentsService.like(id)
    return reply.send(ok(result))
  }
}
