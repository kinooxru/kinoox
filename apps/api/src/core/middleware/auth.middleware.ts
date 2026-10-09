/**
 * Аутентификация запросов.
 *
 * `optionalAuth` — пытается определить пользователя, но не требует его.
 * `authGuard`   — требует валидный access-токен.
 * `adminGuard`  — требует роль admin.
 */
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import type { JwtPayload } from '../plugins/jwt.plugin.js'
import { forbidden, unauthorized } from '../types.js'

/** Тот же формат, что и у AccessPayload: `sub` — ID пользователя */
export type { JwtPayload }

function extractBearer(request: FastifyRequest): string | null {
  const header = request.headers.authorization
  if (!header) return null
  const [scheme, token] = header.split(' ')
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return null
  return token
}

/** Пытается распознать пользователя; при любой проблеме оставляет его пустым */
export async function optionalAuth(request: FastifyRequest): Promise<void> {
  request.currentUser = null
  request.isAdmin = false

  const token = extractBearer(request)
  if (!token) return

  try {
    const payload = request.server.jwt.access.verify<JwtPayload>(token)
    if (payload.type !== 'access') return
    request.currentUser = payload
    request.isAdmin = payload.role === 'admin'
  } catch {
    // Невалидный токен для необязательной авторизации — просто гость
  }
}

/** Требует валидный access-токен */
export async function authGuard(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  request.currentUser = null
  request.isAdmin = false

  const token = extractBearer(request)
  if (!token) throw unauthorized('Не передан токен доступа')

  try {
    const payload = request.server.jwt.access.verify<JwtPayload>(token)
    if (payload.type !== 'access') throw unauthorized('Неверный тип токена')
    request.currentUser = payload
    request.isAdmin = payload.role === 'admin'
  } catch {
    throw unauthorized('Токен доступа недействителен или истёк')
  }

  // Пользователь мог быть удалён после выдачи токена
  const current = request.currentUser
  if (!current) throw unauthorized('Токен доступа недействителен или истёк')

  const exists = await request.server.prisma.user.findUnique({
    where: { id: current.sub },
    select: { id: true },
  })
  if (!exists) throw unauthorized('Учётная запись не найдена')
}

/** Требует роль admin */
export async function adminGuard(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  await authGuard(request, reply)
  if (!request.isAdmin) throw forbidden('Доступ только для администраторов')
}

/** Регистрирует декораторы fastify.authenticate / fastify.requireAdmin */
export function registerAuthDecorators(fastify: FastifyInstance): void {
  fastify.decorate('authenticate', authGuard)
  fastify.decorate('optionalAuth', optionalAuth)
  fastify.decorate('requireAdmin', adminGuard)
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: typeof authGuard
    optionalAuth: typeof optionalAuth
    requireAdmin: typeof adminGuard
  }
}

/** Достаёт пользователя из запроса или бросает 401 */
export function requireUser(request: FastifyRequest): JwtPayload {
  if (!request.currentUser) throw unauthorized('Требуется авторизация')
  return request.currentUser
}
