/**
 * API-клиент десктопного приложения.
 * Токены хранятся в localStorage WebView — он изолирован на уровне приложения.
 */
import { createApiClient, type AuthTokensDTO } from '@kinoox/api-client'

const ACCESS_KEY = 'kinoox.desktop.accessToken'
const REFRESH_KEY = 'kinoox.desktop.refreshToken'

class DesktopTokenStorage {
  private accessToken: string | null = null
  private refreshToken: string | null = null

  constructor() {
    try {
      this.accessToken = window.localStorage.getItem(ACCESS_KEY)
      this.refreshToken = window.localStorage.getItem(REFRESH_KEY)
    } catch {
      // Хранилище недоступно — работаем без сохранения сессии
    }
  }

  getAccessToken(): string | null {
    return this.accessToken
  }

  getRefreshToken(): string | null {
    return this.refreshToken
  }

  setTokens(tokens: AuthTokensDTO): void {
    this.accessToken = tokens.accessToken
    this.refreshToken = tokens.refreshToken || this.refreshToken
    try {
      window.localStorage.setItem(ACCESS_KEY, tokens.accessToken)
      if (tokens.refreshToken) window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken)
    } catch {
      // Игнорируем
    }
  }

  clear(): void {
    this.accessToken = null
    this.refreshToken = null
    try {
      window.localStorage.removeItem(ACCESS_KEY)
      window.localStorage.removeItem(REFRESH_KEY)
    } catch {
      // Игнорируем
    }
  }
}

/** Базовый URL API. В продакшне — домен kinoox.ru */
const baseUrl =
  (import.meta.env?.VITE_API_URL as string | undefined) ?? 'https://kinoox.ru/api/v1'

export const api = createApiClient({
  baseUrl,
  tokenStorage: new DesktopTokenStorage(),
  timeoutMs: 15_000,
})
