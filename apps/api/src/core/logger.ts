/**
 * Форматирование логов в консоль для разработки.
 */
import { pino } from 'pino'
import { config } from '../config.js'

export const loggerOptions = config.isDevelopment
  ? {
      level: 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
          messageFormat: '{msg}',
        },
      },
    }
  : {
      level: 'info',
      // В продакшне пишем чистый JSON — его собирает Promtail и отдаёт в Loki
      base: {
        service: 'kinoox-api',
        env: config.env,
      },
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'password',
          'passwordHash',
          'refreshToken',
          '*.password',
        ],
        censor: '[скрыто]',
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    }
