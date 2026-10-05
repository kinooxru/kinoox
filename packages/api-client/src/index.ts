/**
 * KINOOX API client — точка входа.
 *
 * Использование:
 * ```ts
 * const api = createApiClient({ baseUrl: 'https://kinoox.ru/api/v1' })
 * const { items } = await api.titles.list({ type: 'movie' })
 * ```
 */
import { HttpClient, MemoryTokenStorage, type HttpClientConfig, type TokenStorage } from './http/client'
import { createAuthEndpoints } from './endpoints/auth'
import { createTitlesEndpoints } from './endpoints/titles'
import { createUserEndpoints } from './endpoints/user'
import { createCommentsEndpoints } from './endpoints/comments'
import { createSearchEndpoints } from './endpoints/search'
import { createDownloadsEndpoints } from './endpoints/downloads'
import { createSystemEndpoints } from './endpoints/system'

export interface ApiClientOptions extends HttpClientConfig {}

export function createApiClient(options: ApiClientOptions) {
  const http = new HttpClient(options)
  return {
    http,
    auth: createAuthEndpoints(http),
    titles: createTitlesEndpoints(http),
    user: createUserEndpoints(http),
    comments: createCommentsEndpoints(http),
    search: createSearchEndpoints(http),
    downloads: createDownloadsEndpoints(http),
    system: createSystemEndpoints(http),
  }
}

export type ApiClient = ReturnType<typeof createApiClient>

export { HttpClient, MemoryTokenStorage, ApiError } from './http/client'
export type { HttpClientConfig, TokenStorage, RequestOptions } from './http/client'
export type { AuthEndpoints } from './endpoints/auth'
export type { TitlesEndpoints } from './endpoints/titles'
export type { UserEndpoints } from './endpoints/user'
export type { CommentsEndpoints } from './endpoints/comments'
export type { SearchEndpoints } from './endpoints/search'
export type { DownloadsEndpoints } from './endpoints/downloads'
export type { SystemEndpoints } from './endpoints/system'
export * from './types/dto'