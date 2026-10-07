/**
 * Плагин JWT: access- и refresh-токены.
 *
 * Два независимых пространства имён:
 *  - `access`  — короткоживущий токен для запросов;
 *  - `refresh` — долгоживущий токен только для /auth/refresh.
 */
import fastifyJwt from '@fastify/jwt'
import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { config } from '../../config.js'

export interface JwtPayload {
  sub: number
  email: string
  username: string
  role: string
  type: 'access' | 'refresh'
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
    user: JwtPayload
  }

  /**
   * Namespaced-декораторы @fastify/jwt: fastify.jwt.access / fastify.jwt.refresh.
   * Плагин создаёт их в рантайме, но не описывает в типах.
   */
  interface JWT {
    access: JwtNamespaceApi
    refresh: JwtNamespaceApi
  }

  interface JwtNamespaceApi {
    sign(payload: JwtPayload, options?: { expiresIn?: number | string }): string
    verify<Decoded = JwtPayload>(token: string): Decoded
    decode<Decoded = JwtPayload>(token: string): Decoded | null
  }
}

export default fp(
  async function jwtPlugin(fastify: FastifyInstance) {
    await fastify.register(fastifyJwt, {
      secret: config.jwt.accessSecret,
      namespace: 'access',
      sign: { expiresIn: config.jwt.accessTtl },
    })

    await fastify.register(fastifyJwt, {
      secret: config.jwt.refreshSecret,
      namespace: 'refresh',
      sign: { expiresIn: config.jwt.refreshTtl },
    })
  },
  { name: 'kinoox-jwt' },
)
