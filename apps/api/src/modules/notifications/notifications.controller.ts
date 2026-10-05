/**
 * HTTP-обработчики модуля уведомлений.
 * Логика живёт в NotificationsService, здесь — только тонкие обёртки.
 */
import type { FastifyReply, FastifyRequest } from 'fastify'
import { requireUser } from '../../core/middleware/auth.middleware'
import { ok } from '../../utils'
import type { NotificationsService } from './notifications.service'

export interface NotificationsControllerDeps {
  notificationsService: NotificationsService
}

/** GET /notifications */
export function makeGetNotifications(deps: NotificationsControllerDeps) {
  return async function getNotifications(request: FastifyRequest, reply: FastifyReply) {
    const user = requireUser(request)
    return reply.send(ok(deps.notificationsService.list(user.sub)))
  }
}

/** POST /notifications/read */
export function makeMarkNotificationsRead(deps: NotificationsControllerDeps) {
  return async function markNotificationsRead(request: FastifyRequest, reply: FastifyReply) {
    const user = requireUser(request)
    const body = (request.body ?? {}) as { ids?: string[] }
    deps.notificationsService.markRead(user.sub, Array.isArray(body.ids) ? body.ids : [])
    return reply.send(ok({ success: true }))
  }
}

/** POST /notifications/subscribe */
export function makeSubscribe(deps: NotificationsControllerDeps) {
  return async function subscribe(request: FastifyRequest, reply: FastifyReply) {
    const user = requireUser(request)
    const body = request.body as { titleId: number }
    deps.notificationsService.subscribe(user.sub, Number(body.titleId))
    return reply.send(ok({ success: true }))
  }
}

/** DELETE /notifications/subscribe/:titleId */
export function makeUnsubscribe(deps: NotificationsControllerDeps) {
  return async function unsubscribe(request: FastifyRequest, reply: FastifyReply) {
    const user = requireUser(request)
    const params = request.params as { titleId: string }
    deps.notificationsService.unsubscribe(user.sub, Number(params.titleId))
    return reply.send(ok({ success: true }))
  }
}
