/**
 * Общие типы API.
 */
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { JwtPayload } from '../core/plugins/jwt.plugin'

export interface ApiEnvelope<T> {
  success: boolean
  data: T | null
  error: string | null
}

export interface Paginated<T> {
  items: T[]
  meta: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

export interface JwtUser {
  sub: number
  email: string
  username: string
  role: string
  type: 'access' | 'refresh'
}

declare module 'fastify' {
  interface FastifyRequest {
    /** Пользователь, если запрос авторизован */
    currentUser: JwtPayload | null
    /** true, если пользователь — администратор */
    isAdmin: boolean
  }
}

export type AuthPreHandler = (request: FastifyRequest, reply: FastifyReply) => Promise<void>

/** Кастомные ошибки, которые плагин error умеет превращать в HTTP-ответы */
export class HttpError extends Error {
  readonly statusCode: number
  readonly code: string

  constructor(statusCode: number, message: string, code = 'http_error') {
    super(message)
    this.name = 'HttpError'
    this.statusCode = statusCode
    this.code = code
  }
}

export const badRequest = (message = 'Некорректный запрос') =>
  new HttpError(400, message, 'bad_request')
export const unauthorized = (message = 'Требуется авторизация') =>
  new HttpError(401, message, 'unauthorized')
export const forbidden = (message = 'Недостаточно прав') => new HttpError(403, message, 'forbidden')
export const notFound = (message = 'Не найдено') => new HttpError(404, message, 'not_found')
export const conflict = (message = 'Конфликт данных') => new HttpError(409, message, 'conflict')
export const tooManyRequests = (message = 'Слишком много запросов') =>
  new HttpError(429, message, 'too_many_requests')
