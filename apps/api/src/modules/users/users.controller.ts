/**
 * HTTP-обработчики модуля пользователей.
 */
import type { FastifyReply, FastifyRequest } from 'fastify'
import { requireUser } from '../../core/middleware/auth.middleware.js'
import { ok } from '../../utils.js'
import { historyInputSchema, historyQuerySchema, updateProfileSchema } from './users.schema.js'
import type { UsersService } from './users.service.js'

export interface UsersControllerDeps {
  usersService: UsersService
}

/** GET /user/profile */
export function makeGetProfile(deps: UsersControllerDeps) {
  return async function getProfile(request: FastifyRequest, reply: FastifyReply) {
    const user = requireUser(request)
    const profile = await deps.usersService.getProfile(user.sub)
    return reply.send(ok(profile))
  }
}

/** PATCH /user/profile */
export function makeUpdateProfile(deps: UsersControllerDeps) {
  return async function updateProfile(request: FastifyRequest, reply: FastifyReply) {
    const user = requireUser(request)
    const input = updateProfileSchema.parse(request.body)
    const profile = await deps.usersService.updateProfile(user.sub, input)
    return reply.send(ok(profile))
  }
}

/** GET /user/history */
export function makeGetHistory(deps: UsersControllerDeps) {
  return async function getHistory(request: FastifyRequest, reply: FastifyReply) {
    const user = requireUser(request)
    const { page, perPage } = historyQuerySchema.parse(request.query)
    const result = await deps.usersService.getHistory(user.sub, page, perPage)
    return reply.send(ok(result))
  }
}

/** POST /user/history */
export function makeAddHistory(deps: UsersControllerDeps) {
  return async function addHistory(request: FastifyRequest, reply: FastifyReply) {
    const user = requireUser(request)
    const input = historyInputSchema.parse(request.body)
    const entry = await deps.usersService.recordView(user.sub, input)
    return reply.code(201).send(ok(entry))
  }
}

/** DELETE /user/history */
export function makeClearHistory(deps: UsersControllerDeps) {
  return async function clearHistory(request: FastifyRequest, reply: FastifyReply) {
    const user = requireUser(request)
    await deps.usersService.clearHistory(user.sub)
    return reply.send(ok({ success: true }))
  }
}

/** GET /user/filters — жанры и годы из истории пользователя */
export function makeGetPersonalFilters(deps: UsersControllerDeps) {
  return async function getPersonalFilters(request: FastifyRequest, reply: FastifyReply) {
    const user = requireUser(request)
    const filters = await deps.usersService.getPersonalFilters(user.sub)
    return reply.send(ok(filters))
  }
}
