/**
 * HTTP-обработчики авторизации.
 */
import type { FastifyReply, FastifyRequest } from 'fastify'
import { requireUser } from '../../core/middleware/auth.middleware'
import { ok } from '../../utils'
import { loginSchema, refreshSchema, registerSchema } from './auth.schema'
import type { AuthService } from './auth.service'

export interface AuthControllerDeps {
  authService: AuthService
}

/** POST /auth/register */
export function makeRegister(deps: AuthControllerDeps) {
  return async function register(request: FastifyRequest, reply: FastifyReply) {
    const input = registerSchema.parse(request.body)
    const result = await deps.authService.register(input)
    return reply.code(201).send(ok(result))
  }
}

/** POST /auth/login */
export function makeLogin(deps: AuthControllerDeps) {
  return async function login(request: FastifyRequest, reply: FastifyReply) {
    const input = loginSchema.parse(request.body)
    const result = await deps.authService.login(input)
    return reply.send(ok(result))
  }
}

/** POST /auth/refresh */
export function makeRefresh(deps: AuthControllerDeps) {
  return async function refresh(request: FastifyRequest, reply: FastifyReply) {
    const input = refreshSchema.parse(request.body)
    const tokens = await deps.authService.refresh(input.refreshToken)
    return reply.send(ok(tokens))
  }
}

/** POST /auth/logout */
export function makeLogout(deps: AuthControllerDeps) {
  return async function logout(request: FastifyRequest, reply: FastifyReply) {
    const user = requireUser(request)
    await deps.authService.logout(user.sub)
    return reply.send(ok({ success: true }))
  }
}
