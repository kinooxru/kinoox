/**
 * Типизированный API-клиент мобильного приложения.
 * Токены хранятся в SecureStore, обновление пары выполняется автоматически.
 */
import { createApiClient } from '@kinoox/api-client'
import { mobileConfig } from './config'
import { tokenStorage } from './storage'

export const api = createApiClient({
  baseUrl: mobileConfig.apiUrl,
  tokenStorage,
  timeoutMs: 15_000,
})

export { tokenStorage }
