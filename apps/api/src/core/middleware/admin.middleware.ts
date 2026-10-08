/**
 * Проверка административных прав для отдельных обработчиков.
 */
import type { FastifyReply, FastifyRequest } from 'fastify'
import { adminGuard, authGuard } from './auth.middleware'

/** Требует авторизации и роли admin */
export async function adminMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await adminGuard(request, reply)
}

/** Только авторизация, без требований к роли */
export async function userMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await authGuard(request, reply)
}

export { authGuard, adminGuard }
