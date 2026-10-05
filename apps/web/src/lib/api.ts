import { createApiClient } from '@kinoox/api-client'
import { siteConfig } from './config'

/**
 * Серверный клиент API — для серверных компонентов и генерации метаданных.
 * Токены не хранятся: SSR работает с публичными данными.
 */
export const api = createApiClient({
  baseUrl: siteConfig.apiUrl,
  timeoutMs: 12_000,
})

/**
 * Клиентский клиент API — создаётся заново на каждый вызов,
 * чтобы не разделять состояние между пользователями на сервере.
 */
export function createBrowserClient(accessToken?: string | null) {
  const client = createApiClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1',
  })
  if (accessToken) {
    client.http.tokens.setTokens({
      accessToken,
      refreshToken: '',
      expiresIn: 0,
    })
  }
  return client
}
