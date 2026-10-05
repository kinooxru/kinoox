/**
 * Хук авторизации мобильного приложения.
 */
import { useCallback, useEffect, useState } from 'react'
import type { UserDTO } from '@kinoox/api-client'
import { api, tokenStorage } from '../lib/api'

export interface UseAuthResult {
  user: UserDTO | null
  loading: boolean
  isAuthenticated: boolean
  login(email: string, password: string): Promise<UserDTO>
  register(email: string, username: string, password: string): Promise<UserDTO>
  logout(): Promise<void>
  refresh(): Promise<void>
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<UserDTO | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const restore = async () => {
      await tokenStorage.hydrate()
      if (!tokenStorage.getAccessToken()) {
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
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.auth.login({ email, password })
    tokenStorage.setTokens(result.tokens)
    setUser(result.user)
    return result.user
  }, [])

  const register = useCallback(async (email: string, username: string, password: string) => {
    const result = await api.auth.register({ email, username, password })
    tokenStorage.setTokens(result.tokens)
    setUser(result.user)
    return result.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.auth.logout()
    } catch {
      // Выходим локально, даже если сервер недоступен
    }
    tokenStorage.clear()
    setUser(null)
  }, [])

  const refresh = useCallback(async () => {
    if (!tokenStorage.getAccessToken()) {
      setUser(null)
      return
    }
    try {
      setUser(await api.auth.me())
    } catch {
      setUser(null)
    }
  }, [])

  return {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    refresh,
  }
}
