/**
 * Модуль уведомлений.
 *
 * Уведомления доставляются двумя путями:
 *  - REST: GET /notifications — список для текущего пользователя;
 *  - Socket.io: событие `new_episode` — о выходе новой серии.
 */
import type { FastifyInstance } from 'fastify'
import type { Server as SocketServer } from 'socket.io'
import type { NotificationDTO } from '@kinoox/api-client'
import type { JwtPayload } from '../../core/plugins/jwt.plugin'

export interface NotificationsServiceDeps {
  /** Socket.io-сервер поднимается в server.ts */
  getSocketServer: () => SocketServer | null
}

export class NotificationsService {
  /** In-memory очередь уведомлений по пользователям */
  private readonly store = new Map<number, NotificationDTO[]>()
  /** Подписки пользователей на тайтлы (для точечной доставки) */
  private readonly subscriptions = new Map<number, Set<number>>()

  constructor(private readonly deps: NotificationsServiceDeps) {}

  /** Список уведомлений пользователя, свежие сверху */
  list(userId: number): NotificationDTO[] {
    return this.store.get(userId) ?? []
  }

  /** Отметить уведомления прочитанными */
  markRead(userId: number, ids: string[]): void {
    const items = this.store.get(userId)
    if (!items) return
    for (const item of items) {
      if (ids.includes(item.id)) item.read = true
    }
  }

  /** Пользователь подписывается на тайтл, чтобы получать уведомления о сериях */
  subscribe(userId: number, titleId: number): void {
    const set = this.subscriptions.get(userId) ?? new Set<number>()
    set.add(titleId)
    this.subscriptions.set(userId, set)
  }

  unsubscribe(userId: number, titleId: number): void {
    this.subscriptions.get(userId)?.delete(titleId)
  }

  /** Публикация уведомления о новой серии всем, кто следит за тайтлом */
  async publishNewEpisode(params: {
    titleId: number
    titleName: string
    season: number
    episode: number
  }): Promise<void> {
    const notification: NotificationDTO = {
      id: `${params.titleId}-${params.season}-${params.episode}-${Date.now()}`,
      type: 'new_episode',
      titleId: params.titleId,
      titleName: params.titleName,
      message: `Вышла ${params.season} сезон ${params.episode} серия — «${params.titleName}»`,
      createdAt: new Date().toISOString(),
      read: false,
    }

    const socket = this.deps.getSocketServer()

    for (const [userId, titleIds] of this.subscriptions.entries()) {
      if (!titleIds.has(params.titleId)) continue
      this.push(userId, notification)
      socket?.to(`user:${userId}`).emit('notification', notification)
    }

    // Общая рассылка всем подключённым — лента «Новое на KINOOX»
    socket?.emit('new_episode', notification)
  }

  /** Добавить уведомление конкретному пользователю */
  push(userId: number, notification: NotificationDTO): void {
    const items = this.store.get(userId) ?? []
    items.unshift(notification)
    // Держим не больше 100 уведомлений на пользователя
    this.store.set(userId, items.slice(0, 100))
  }

  /** Регистрация роутов модуля */
  async register(fastify: FastifyInstance): Promise<void> {
    const self = this

    fastify.get(
      '/notifications',
      { preHandler: [fastify.authenticate] },
      async function getNotifications(request, reply) {
        const user = request.currentUser as JwtPayload
        return reply.send({ success: true, data: self.list(user.sub), error: null })
      },
    )

    fastify.post(
      '/notifications/read',
      { preHandler: [fastify.authenticate] },
      async function markNotificationsRead(request, reply) {
        const user = request.currentUser as JwtPayload
        const body = (request.body ?? {}) as { ids?: string[] }
        self.markRead(user.sub, Array.isArray(body.ids) ? body.ids : [])
        return reply.send({ success: true, data: { success: true }, error: null })
      },
    )
  }
}
