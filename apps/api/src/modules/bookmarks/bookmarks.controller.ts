/**
 * HTTP-обработчики модуля закладок.
 */
import type { FastifyReply, FastifyRequest } from 'fastify'
import { requireUser } from '../../core/middleware/auth.middleware.js'
import { ok } from '../../utils.js'
import {
  bookmarkQuerySchema,
  bookmarkTitleParamSchema,
  createBookmarkSchema,
  updateBookmarkSchema,
} from './bookmarks.schema.js'
import type { BookmarksService } from './bookmarks.service.js'

export interface BookmarksControllerDeps {
  bookmarksService: BookmarksService
}

/** GET /user/bookmarks */
export function makeGetBookmarks(deps: BookmarksControllerDeps) {
  return async function getBookmarks(request: FastifyRequest, reply: FastifyReply) {
    const user = requireUser(request)
    const { status, page, perPage } = bookmarkQuerySchema.parse(request.query)
    const result = await deps.bookmarksService.list(user.sub, { status, page, perPage })
    return reply.send(ok(result))
  }
}

/** POST /user/bookmarks */
export function makeAddBookmark(deps: BookmarksControllerDeps) {
  return async function addBookmark(request: FastifyRequest, reply: FastifyReply) {
    const user = requireUser(request)
    const input = createBookmarkSchema.parse(request.body)
    const bookmark = await deps.bookmarksService.upsert(user.sub, input)
    return reply.code(201).send(ok(bookmark))
  }
}

/** PATCH /user/bookmarks/:titleId */
export function makeUpdateBookmark(deps: BookmarksControllerDeps) {
  return async function updateBookmark(request: FastifyRequest, reply: FastifyReply) {
    const user = requireUser(request)
    const { titleId } = bookmarkTitleParamSchema.parse(request.params)
    const input = updateBookmarkSchema.parse(request.body)
    const bookmark = await deps.bookmarksService.update(user.sub, titleId, input)
    return reply.send(ok(bookmark))
  }
}

/** DELETE /user/bookmarks/:titleId */
export function makeRemoveBookmark(deps: BookmarksControllerDeps) {
  return async function removeBookmark(request: FastifyRequest, reply: FastifyReply) {
    const user = requireUser(request)
    const { titleId } = bookmarkTitleParamSchema.parse(request.params)
    await deps.bookmarksService.remove(user.sub, titleId)
    return reply.send(ok({ success: true }))
  }
}

/** GET /user/bookmarks/:titleId/status */
export function makeGetBookmarkStatus(deps: BookmarksControllerDeps) {
  return async function getBookmarkStatus(request: FastifyRequest, reply: FastifyReply) {
    const user = requireUser(request)
    const { titleId } = bookmarkTitleParamSchema.parse(request.params)
    const status = await deps.bookmarksService.getStatus(user.sub, titleId)
    return reply.send(ok(status))
  }
}

/** GET /user/bookmarks/counters */
export function makeGetBookmarkCounters(deps: BookmarksControllerDeps) {
  return async function getBookmarkCounters(request: FastifyRequest, reply: FastifyReply) {
    const user = requireUser(request)
    const counters = await deps.bookmarksService.getCounters(user.sub)
    return reply.send(ok(counters))
  }
}
