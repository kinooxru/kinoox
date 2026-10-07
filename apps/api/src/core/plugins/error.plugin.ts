/**
 * Плагин обработки ошибок: единый конверт ответа
 * `{ success, data, error }` для всех эндпоинтов.
 */
import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'
import { HttpError } from '../types.js'

/** Минимальная форма ошибки Fastify, нужная обработчику */
interface FastifyLikeError extends Error {
  statusCode?: number
  code?: string
  validation?: Array<{ message?: string }>
}

interface ErrorBody {
  success: false
  data: null
  error: string
}

function envelope(message: string): ErrorBody {
  return { success: false, data: null, error: message }
}

/** Человекочитаемое сообщение для ошибки валидации Zod */
export function formatZodError(error: ZodError): string {
  const first = error.issues[0]
  if (!first) return 'Некорректные данные запроса'
  const path = first.path.join('.')
  return path ? `${path}: ${first.message}` : first.message
}

export default fp(
  async function errorPlugin(fastify: FastifyInstance) {
    fastify.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
      reply.code(404).send(envelope(`Маршрут ${request.method} ${request.url} не найден`))
    })

    fastify.setErrorHandler((error: FastifyLikeError, request, reply) => {
      // Ошибки валидации Zod
      if (error instanceof ZodError) {
        request.log.info({ err: error }, 'Ошибка валидации запроса')
        return reply.code(422).send(envelope(formatZodError(error)))
      }

      // Наши HttpError
      if (error instanceof HttpError) {
        if (error.statusCode >= 500) request.log.error({ err: error }, error.message)
        return reply.code(error.statusCode).send(envelope(error.message))
      }

      // Ошибки валидации схем Fastify
      if (error.validation) {
        const detail = error.validation
          .map((item) => item.message)
          .filter(Boolean)
          .join('; ')
        return reply
          .code(error.statusCode ?? 400)
          .send(envelope(detail || 'Некорректные параметры запроса'))
      }

      const statusCode = error.statusCode ?? 500
      const isServerError = statusCode >= 500

      if (isServerError) {
        request.log.error({ err: error }, 'Внутренняя ошибка сервера')
      } else {
        request.log.warn({ err: error }, 'Ошибка запроса')
      }

      // Коды Prisma переводим в понятные сообщения
      const prismaCode = error.code
      if (prismaCode === 'P2002') {
        return reply.code(409).send(envelope('Такая запись уже существует'))
      }
      if (prismaCode === 'P2025') {
        return reply.code(404).send(envelope('Запись не найдена'))
      }
      if (prismaCode === 'P2003') {
        return reply.code(400).send(envelope('Нарушение ссылочной целостности'))
      }

      return reply
        .code(statusCode)
        .send(envelope(isServerError ? 'Внутренняя ошибка сервера KINOOX' : error.message))
    })
  },
  { name: 'kinoox-error' },
)
