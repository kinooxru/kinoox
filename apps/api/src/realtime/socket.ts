/**
 * Socket.io — realtime-канал KINOOX.
 *
 * Комнаты:
 *   user:<id>  — персональные уведомления пользователя;
 *   title:<id> — подписка на события конкретного тайтла (совместный просмотр).
 *
 * События сервер → клиент:
 *   notification  — новое уведомление;
 *   new_episode   — вышла новая серия;
 *   watch_party   — синхронизация совместного просмотра.
 */
import { Server as SocketServer } from 'socket.io'
import type { FastifyInstance } from 'fastify'
import { config } from '../config.js'
import type { JwtPayload } from '../core/plugins/jwt.plugin'

export function createSocketServer(fastify: FastifyInstance): SocketServer {
  const io = new SocketServer(fastify.server, {
    path: '/socket.io',
    cors: {
      origin: config.server.corsOrigins,
      credentials: true,
    },
    serveClient: false,
    transports: ['websocket', 'polling'],
    pingInterval: 25_000,
    pingTimeout: 20_000,
    maxHttpBufferSize: 1e6,
  })

  // Аутентификация по access-токену; без токена — анонимный зритель
  io.use((socket, next) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      (socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, '') as string | undefined)

    if (!token) {
      socket.data.user = null
      return next()
    }

    try {
      const payload = fastify.jwt.access.verify<JwtPayload>(token)
      socket.data.user = payload.type === 'access' ? payload : null
    } catch {
      socket.data.user = null
    }

    next()
  })

  io.on('connection', (socket) => {
    const user = socket.data.user as JwtPayload | null

    if (user) {
      void socket.join(`user:${user.sub}`)
      fastify.log.debug({ userId: user.sub, socketId: socket.id }, 'Socket подключён')
    }

    /** Подписка на события тайтла */
    socket.on('title:subscribe', (titleId: number) => {
      if (!Number.isFinite(titleId)) return
      void socket.join(`title:${titleId}`)
    })

    socket.on('title:unsubscribe', (titleId: number) => {
      if (!Number.isFinite(titleId)) return
      void socket.leave(`title:${titleId}`)
    })

    /** Совместный просмотр: пересылаем состояние остальным участникам комнаты */
    socket.on('watch_party:sync', (payload: { roomId: string; event: string; time?: number }) => {
      if (!payload?.roomId) return
      socket.to(`party:${payload.roomId}`).emit('watch_party:sync', {
        ...payload,
        username: user?.username ?? 'Гость',
      })
    })

    socket.on('watch_party:join', (roomId: string) => {
      if (typeof roomId !== 'string' || !roomId) return
      void socket.join(`party:${roomId}`)
      socket.to(`party:${roomId}`).emit('watch_party:joined', {
        username: user?.username ?? 'Гость',
      })
    })

    socket.on('watch_party:leave', (roomId: string) => {
      if (typeof roomId !== 'string') return
      void socket.leave(`party:${roomId}`)
    })

    socket.on('disconnect', (reason) => {
      fastify.log.debug({ socketId: socket.id, reason }, 'Socket отключён')
    })
  })

  fastify.log.info('Socket.io поднят на /socket.io')
  return io
}
