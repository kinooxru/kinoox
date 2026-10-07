import type { FastifyInstance } from 'fastify'
import {
  makeGetNotifications,
  makeMarkNotificationsRead,
  makeSubscribe,
  makeUnsubscribe,
  type NotificationsControllerDeps,
} from './notifications.controller.js'

export interface NotificationsRoutesOptions {
  deps: NotificationsControllerDeps
}

/**
 * Роуты уведомлений — все требуют авторизации.
 *
 * GET    /api/v1/notifications
 * POST   /api/v1/notifications/read
 * POST   /api/v1/notifications/subscribe
 * DELETE /api/v1/notifications/subscribe/:titleId
 */
export default async function notificationsRoutes(
  fastify: FastifyInstance,
  options: NotificationsRoutesOptions,
): Promise<void> {
  const { deps } = options
  const auth = { preHandler: [fastify.authenticate] }

  fastify.get('/notifications', auth, makeGetNotifications(deps))
  fastify.post('/notifications/read', auth, makeMarkNotificationsRead(deps))
  fastify.post('/notifications/subscribe', auth, makeSubscribe(deps))
  fastify.delete('/notifications/subscribe/:titleId', auth, makeUnsubscribe(deps))
}
