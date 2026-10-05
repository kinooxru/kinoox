/**
 * KINOOX — HTTP-клиент.
 *
 * Один универсальный клиент для сайта, мобильного и десктопного приложений.
 * Работает на fetch (web, React Native, WebView), поддерживает:
 *  - базовый URL из конфигурации;
 *  - автоматическую подстановку access-токена;
 *  - обновление пары токенов по refresh при 401;
 *  - разбор конверта { success, data, error }.
 */
import type { ApiResponse, AuthTokensDTO } from '../types/dto'

export interface HttpClientConfig {
  /** Базовый URL API, например https://kinoox.ru/api/v1 */
  baseUrl: string
  /** Хранилище токенов; по умолчанию — в памяти */
  tokenStorage?: TokenStorage
  /** Вызывается, когда обновить токены не удалось */
  onUnauthorized?: () => void
  /** Дополнительные заголовки на каждый запрос */
  defaultHeaders?: Record<string, string>
  /** Таймаут запроса в миллисекундах */
  timeoutMs?: number
}

export interface TokenStorage {
  getAccessToken(): string | null
  getRefreshToken(): string | null
  setTokens(tokens: AuthTokensDTO): void
  clear(): void
}

/** Хранилище токенов в памяти — дефолт для SSR и тестов */
export class MemoryTokenStorage implements TokenStorage {
  private accessToken: string | null = null
  private refreshToken: string | null = null

  getAccessToken(): string | null {
    return this.accessToken
  }

  getRefreshToken(): string | null {
    return this.refreshToken
  }

  setTokens(tokens: AuthTokensDTO): void {
    this.accessToken = tokens.accessToken
    this.refreshToken = tokens.refreshToken
  }

  clear(): void {
    this.accessToken = null
    this.refreshToken = null
  }
}

export class ApiError extends Error {
  readonly status: number
  readonly payload: unknown

  constructor(message: string, status: number, payload: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export type QueryValue = string | number | boolean | undefined | null | Array<string | number>

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  query?: Record<string, QueryValue>
  body?: unknown
  /** Не подставлять access-токен */
  skipAuth?: boolean
  /** Не пытаться обновить токен при 401 */
  skipRefresh?: boolean
  headers?: Record<string, string>
  signal?: AbortSignal
  /** Next.js-специфичные опции кэширования передаются как есть */
  next?: { revalidate?: number | false; tags?: string[] }
}

function buildQuery(query: Record<string, QueryValue> | undefined): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, String(item))
    } else {
      params.append(key, String(value))
    }
  }
  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

export class HttpClient {
  private readonly config: Required<Pick<HttpClientConfig, 'baseUrl' | 'timeoutMs'>> &
    Omit<HttpClientConfig, 'baseUrl' | 'timeoutMs'>
  private readonly tokenStorage: TokenStorage
  private refreshPromise: Promise<boolean> | null = null

  constructor(config: HttpClientConfig) {
    this.config = {
      timeoutMs: 15000,
      ...config,
    }
    this.tokenStorage = config.tokenStorage ?? new MemoryTokenStorage()
  }

  /** Прямой доступ к хранилищу токенов (нужен провайдеру авторизации) */
  get tokens(): TokenStorage {
    return this.tokenStorage
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.execute<T>(path, options, true)
  }

  private async execute<T>(
    path: string,
    options: RequestOptions,
    allowRefresh: boolean,
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}${buildQuery(options.query)}`
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...this.config.defaultHeaders,
      ...options.headers,
    }

    if (options.body !== undefined) headers['Content-Type'] = 'application/json'

    if (!options.skipAuth) {
      const token = this.tokenStorage.getAccessToken()
      if (token) headers.Authorization = `Bearer ${token}`
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs)
    const signal = options.signal ?? controller.signal

    let response: Response
    try {
      response = await fetch(url, {
        method: options.method ?? 'GET',
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal,
        ...(options.next ? { next: options.next } : {}),
      } as RequestInit)
    } catch (error) {
      clearTimeout(timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('Превышено время ожидания ответа сервера', 408)
      }
      throw new ApiError('Не удалось соединиться с сервером KINOOX', 0, error)
    } finally {
      clearTimeout(timeout)
    }

    if (response.status === 401 && allowRefresh && !options.skipAuth && !options.skipRefresh) {
      const refreshed = await this.refreshTokens()
      if (refreshed) return this.execute<T>(path, options, false)
      this.tokenStorage.clear()
      this.config.onUnauthorized?.()
    }

    const text = await response.text()
    let payload: unknown = null
    if (text) {
      try {
        payload = JSON.parse(text)
      } catch {
        payload = text
      }
    }

    if (!response.ok) {
      throw new ApiError(extractErrorMessage(payload, response.status), response.status, payload)
    }

    // Все эндпоинты отвечают конвертом { success, data, error }
    if (isApiResponse<T>(payload)) {
      if (!payload.success) {
        throw new ApiError(payload.error ?? 'Неизвестная ошибка API', response.status, payload)
      }
      return payload.data as T
    }

    return payload as T
  }

  private async refreshTokens(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise
    const refreshToken = this.tokenStorage.getRefreshToken()
    if (!refreshToken) return false

    this.refreshPromise = (async () => {
      try {
        const result = await this.execute<AuthTokensDTO>(
          '/auth/refresh',
          { method: 'POST', body: { refreshToken }, skipAuth: true, skipRefresh: true },
          false,
        )
        this.tokenStorage.setTokens(result)
        return true
      } catch {
        return false
      } finally {
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }
}

function isApiResponse<T>(payload: unknown): payload is ApiResponse<T> {
  return typeof payload === 'object' && payload !== null && 'success' in payload && 'data' in payload
}

function extractErrorMessage(payload: unknown, status: number): string {
  if (typeof payload === 'object' && payload !== null) {
    const record = payload as Record<string, unknown>
    if (typeof record.error === 'string' && record.error) return record.error
    if (typeof record.message === 'string' && record.message) return record.message
  }
  if (status === 404) return 'Запрашиваемый ресурс не найден'
  if (status === 429) return 'Слишком много запросов — попробуйте позже'
  if (status >= 500) return 'Ошибка на стороне сервера KINOOX'
  return `Запрос завершился с ошибкой ${status}`
}