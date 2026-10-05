'use client'

import React from 'react'
import { createApiClient, type ApiClient } from '@kinoox/api-client'
import type { AuthTokensDTO, UserDTO } from '@kinoox/api-client'

const ACCESS_TOKEN_KEY = 'kinoox.accessToken'
const REFRESH_TOKEN_KEY = 'kinoox.refreshToken'

/** Хранилище токенов в localStorage — работает и на сайте, и в WebView десктопа */
class BrowserTokenStorage {
  private accessToken: string | null = null
  private refreshToken: string | null = null

  constructor() {
    if (typeof window === 'undefined') return
    try {
      this.accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY)
      this.refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY)
    } catch {
      // Приватный режим или запрет хранилища — работаем без сохранения
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
    this.refreshToken = tokens.refreshToken
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
      if (tokens.refreshToken) {
        window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
      }
    } catch {
      // Игнорируем недоступность хранилища
    }
  }

  clear(): void {
    this.accessToken = null
    this.refreshToken = null
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(ACCESS_TOKEN_KEY)
      window.localStorage.removeItem(REFRESH_TOKEN_KEY)
    } catch {
      // Игнорируем
    }
  }
}

export interface AuthContextValue {
  api: ApiClient
  user: UserDTO | null
  /** Первичная проверка сессии ещё идёт */
  loading: boolean
  isAuthenticated: boolean
  login(email: string, password: string): Promise<UserDTO>
  register(email: string, username: string, password: string): Promise<UserDTO>
  logout(): Promise<void>
  refreshProfile(): Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const storageRef = React.useRef<BrowserTokenStorage | null>(null)
  const [user, setUser] = React.useState<UserDTO | null>(null)
  const [loading, setLoading] = React.useState(true)

  if (storageRef.current === null && typeof window !== 'undefined') {
    storageRef.current = new BrowserTokenStorage()
  }

  const api = React.useMemo(() => {
    const client = createApiClient({
      baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1',
      tokenStorage: storageRef.current ?? undefined,
      onUnauthorized: () => setUser(null),
    })
    return client
  }, [])

  // Проверяем сохранённую сессию при монтировании
  React.useEffect(() => {
    let cancelled = false

    const restore = async () => {
      if (!storageRef.current?.getAccessToken()) {
        setLoading(false)
        return
      }

      try {
        const profile = await api.auth.me()
        if (!cancelled) setUser(profile)
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void restore()
    return () => {
      cancelled = true
    }
  }, [api])

  const login = React.useCallback<AuthContextValue['login']>(
    async (email, password) => {
      const result = await api.auth.login({ email, password })
      storageRef.current?.setTokens(result.tokens)
      setUser(result.user)
      return result.user
    },
    [api],
  )

  const register = React.useCallback<AuthContextValue['register']>(
    async (email, username, password) => {
      const result = await api.auth.register({ email, username, password })
      storageRef.current?.setTokens(result.tokens)
      setUser(result.user)
      return result.user
    },
    [api],
  )

  const logout = React.useCallback<AuthContextValue['logout']>(async () => {
    try {
      await api.auth.logout()
    } catch {
      // Даже если сервер недоступен — локально выходим
    }
    storageRef.current?.clear()
    setUser(null)
  }, [api])

  const refreshProfile = React.useCallback<AuthContextValue['refreshProfile']>(async () => {
    if (!storageRef.current?.getAccessToken()) {
      setUser(null)
      return
    }
    const profile = await api.auth.me()
    setUser(profile)
  }, [api])

  const value = React.useMemo<AuthContextValue>(
    () => ({
      api,
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshProfile,
    }),
    [api, user, loading, login, register, logout, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext)
  if (!context) throw new Error('useAuth должен вызываться внутри AuthProvider')
  return context
}
