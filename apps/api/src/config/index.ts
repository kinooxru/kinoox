/**
 * Конфигурация API. Читается из переменных окружения один раз при старте.
 * Секреты в репозиторий не попадают — только через .env.
 */
import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'

const currentDir = __dirname

// Подгружаем .env файл при запуске (включая запуск tsx watch / node)
for (const envPath of [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
  path.resolve(currentDir, '../../../../.env'),
]) {
  if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile(envPath)
    } catch {
      // Игнорируем ошибки, если файл уже прочитан
    }
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  TZ: z.string().default('Europe/Moscow'),

  // Сервер
  API_PORT: z.coerce.number().int().positive().default(3001),
  API_HOST: z.string().default('0.0.0.0'),
  API_PUBLIC_URL: z.string().default('http://localhost:3001/api/v1'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  // База
  DATABASE_URL: z.string().optional(),
  POSTGRES_URL: z.string().optional(),

  // Кэш
  REDIS_URL: z.string().default('redis://localhost:6379'),
  CACHE_TTL_DEFAULT: z.coerce.number().int().positive().default(300),

  // Авторизация
  JWT_ACCESS_SECRET: z.string().min(16).default('kinoox-dev-access-secret-change-me'),
  JWT_REFRESH_SECRET: z.string().min(16).default('kinoox-dev-refresh-secret-change-me'),
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL: z.coerce.number().int().positive().default(2_592_000),

  // Балансеры
  PLAYERS_MODE: z.enum(['real', 'mock']).default('mock'),
  PLAYERS_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
  PLAYERS_CACHE_TTL: z.coerce.number().int().positive().default(600),

  VIBIX_API_BASE: z.string().default('https://vibix.org'),
  VIBIX_API_KEY: z.string().default(''),
  VIBIX_PUBLISHER_ID: z.string().default(''),
  VIBIX_PRIORITY: z.coerce.number().int().default(2),

  VEOVEO_API_BASE: z.string().default('https://webmaster-api.rstprgapipt.com'),
  VEOVEO_CATALOG_SYNC_BASE: z.string().default('https://catalog-sync-api.rstprgapipt.com'),
  VEOVEO_PLAYER_DOMAIN: z.string().default(''),
  VEOVEO_API_TOKEN: z.string().default(''),
  VEOVEO_PRIORITY: z.coerce.number().int().default(1),

  // Лимиты
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
    .join('\n')
  throw new Error(`Некорректная конфигурация окружения:\n${issues}`)
}

const env = parsed.data

const corsOrigins = env.CORS_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

export const config = {
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  timezone: env.TZ,

  server: {
    port: env.API_PORT,
    host: env.API_HOST,
    publicUrl: env.API_PUBLIC_URL,
    corsOrigins,
  },

  database: {
    url: env.DATABASE_URL ?? env.POSTGRES_URL ?? '',
  },

  redis: {
    url: env.REDIS_URL,
    defaultTtl: env.CACHE_TTL_DEFAULT,
  },

  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessTtl: env.JWT_ACCESS_TTL,
    refreshTtl: env.JWT_REFRESH_TTL,
  },

  players: {
    mode: env.PLAYERS_MODE,
    timeoutMs: env.PLAYERS_TIMEOUT_MS,
    cacheTtl: env.PLAYERS_CACHE_TTL,
    vibix: {
      baseUrl: env.VIBIX_API_BASE,
      apiKey: env.VIBIX_API_KEY,
      publisherId: env.VIBIX_PUBLISHER_ID,
      priority: env.VIBIX_PRIORITY,
    },
    veoveo: {
      baseUrl: env.VEOVEO_API_BASE,
      catalogSyncBaseUrl: env.VEOVEO_CATALOG_SYNC_BASE,
      playerDomain: env.VEOVEO_PLAYER_DOMAIN,
      token: env.VEOVEO_API_TOKEN,
      priority: env.VEOVEO_PRIORITY,
    },
  },

  rateLimit: {
    max: env.RATE_LIMIT_MAX,
    window: env.RATE_LIMIT_WINDOW,
  },
} as const

export type AppConfig = typeof config
