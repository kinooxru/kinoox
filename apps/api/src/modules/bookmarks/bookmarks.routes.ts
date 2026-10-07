import type { FastifyInstance } from 'fastify'
import {
  makeAddBookmark,
  makeGetBookmarkCounters,
  makeGetBookmarks,
  makeGetBookmarkStatus,
  makeRemoveBookmark,
  makeUpdateBookmark,
  type BookmarksControllerDeps,
} from './bookmarks.controller.js'

export interface BookmarksRoutesOptions {
  deps: BookmarksControllerDeps
}

/**
 * Роуты закладок — все требуют авторизации.
 *
 * GET    /api/v1/user/bookmarks
 * GET    /api/v1/user/bookmarks/counters
 * GET    /api/v1/user/bookmarks/:titleId/status
 * POST   /api/v1/user/bookmarks
 * PATCH  /api/v1/user/bookmarks/:titleId
 * DELETE /api/v1/user/bookmarks/:titleId
 */
export default async function bookmarksRoutes(
  fastify: FastifyInstance,
  options: BookmarksRoutesOptions,
): Promise<void> {
  const { deps } = options
  const auth = { preHandler: [fastify.authenticate] }

  // Внимание: статические сегменты объявлены раньше параметрических,
  // иначе Fastify примет «counters» за :titleId
  fastify.get('/user/bookmarks/counters', auth, makeGetBookmarkCounters(deps))
  fastify.get('/user/bookmarks', auth, makeGetBookmarks(deps))
  fastify.get('/user/bookmarks/:titleId/status', auth, makeGetBookmarkStatus(deps))
  fastify.post('/user/bookmarks', auth, makeAddBookmark(deps))
  fastify.patch('/user/bookmarks/:titleId', auth, makeUpdateBookmark(deps))
  fastify.delete('/user/bookmarks/:titleId', auth, makeRemoveBookmark(deps))
}
