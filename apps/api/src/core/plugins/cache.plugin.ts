/**
 * Плагин Redis-кэша.
 *
 * Декораторы:
 *  - fastify.redis      — клиент ioredis;
 *  - fastify.cache      — обёртка с сериализацией JSON и TTL по умолчанию.
 *
 * Если Redis недоступен, API продолжает работать: кэш переходит в режим «сквозной»
 * (все чтения — мимо кэша, записи игнорируются).
 */
import Redis from 'ioredis'
import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { config } from '../../config'

export interface CacheService {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>
  del(...keys: string[]): Promise<void>
  /** Удалить все ключи по шаблону (SCAN, без блокировки Redis) */
  delByPattern(pattern: string): Promise<number>
  /** get-or-set */
  wrap<T>(key: string, ttlSeconds: number, factory: () => Promise<T>): Promise<T>
  readonly available: boolean
}

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis
    cache: CacheService
  }
}

export const cacheKeys = {
  title: (id: number) => `kinoox:title:${id}`,
  titleList: (hash: string) => `kinoox:titles:list:${hash}`,
  titleSources: (id: number) => `kinoox:title:${id}:sources`,
  titleEpisodes: (id: number) => `kinoox:title:${id}:episodes`,
  collections: () => 'kinoox:collections',
  filters: () => 'kinoox:filters',
  downloads: () => 'kinoox:downloads',
  downloadsPlatform: (platform: string) => `kinoox:downloads:${platform}`,
  downloadsChangelog: (platform?: string) => `kinoox:downloads:changelog:${platform ?? 'all'}`,
  suggest: (query: string) => `kinoox:search:suggest:${query.toLowerCase()}`,
  trending: () => 'kinoox:search:trending',
  stats: () => 'kinoox:stats',
  health: () => 'kinoox:health',
} as const

export default fp(
  async function cachePlugin(fastify: FastifyInstance) {
    const redis = new Redis(config.redis.url, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 500, 5000),
    })

    let available = false

    redis.on('ready', () => {
      available = true
      fastify.log.info('Redis подключён')
    })
    redis.on('error', (error) => {
      if (available) fastify.log.warn({ err: error }, 'Redis недоступен — кэш отключён')
      available = false
    })
    redis.on('end', () => {
      available = false
    })

    try {
      await redis.connect()
      available = true
    } catch (error) {
      available = false
      fastify.log.warn(
        { err: error },
        'Не удалось подключиться к Redis на старте — API работает без кэша',
      )
    }

    const cache: CacheService = {
      get available() {
        return available
      },

      async get<T>(key: string): Promise<T | null> {
        if (!available) return null
        try {
          const raw = await redis.get(key)
          if (raw === null) return null
          return JSON.parse(raw) as T
        } catch (error) {
          fastify.log.warn({ err: error, key }, 'Ошибка чтения из кэша')
          return null
        }
      },

      async set<T>(key: string, value: T, ttlSeconds = config.redis.defaultTtl): Promise<void> {
        if (!available) return
        try {
          await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
        } catch (error) {
          fastify.log.warn({ err: error, key }, 'Ошибка записи в кэш')
        }
      },

      async del(...keys: string[]): Promise<void> {
        if (!available || keys.length === 0) return
        try {
          await redis.del(...keys)
        } catch (error) {
          fastify.log.warn({ err: error, keys }, 'Ошибка удаления ключей кэша')
        }
      },

      async delByPattern(pattern: string): Promise<number> {
        if (!available) return 0
        let deleted = 0
        try {
          let cursor = '0'
          do {
            const [nextCursor, found] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 200)
            cursor = nextCursor
            if (found.length > 0) {
              await redis.del(...found)
              deleted += found.length
            }
          } while (cursor !== '0')
        } catch (error) {
          fastify.log.warn({ err: error, pattern }, 'Ошибка очистки кэша по шаблону')
        }
        return deleted
      },

      async wrap<T>(key: string, ttlSeconds: number, factory: () => Promise<T>): Promise<T> {
        const cached = await this.get<T>(key)
        if (cached !== null) return cached
        const value = await factory()
        if (value !== null && value !== undefined) await this.set(key, value, ttlSeconds)
        return value
      },
    }

    fastify.decorate('redis', redis)
    fastify.decorate('cache', cache)

    fastify.addHook('onClose', async () => {
      try {
        await redis.quit()
      } catch {
        redis.disconnect()
      }
    })
  },
  { name: 'kinoox-cache' },
)
