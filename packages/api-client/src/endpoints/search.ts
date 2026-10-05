import type { HttpClient } from '../http/client'
import type { PaginatedResponse, SearchResultDTO, TitleCardDTO, TitleType } from '../types/dto'

export interface SearchOptions {
  q: string
  type?: TitleType
  page?: number
  perPage?: number
}

export function createSearchEndpoints(http: HttpClient) {
  return {
    /** GET /search */
    search(options: SearchOptions): Promise<SearchResultDTO> {
      return http.request<SearchResultDTO>('/search', {
        query: {
          q: options.q,
          type: options.type,
          page: options.page,
          perPage: options.perPage,
        },
        skipAuth: true,
      })
    },

    /** GET /search/suggest — быстрые подсказки для expandable-поиска в шапке */
    suggest(q: string, limit = 8): Promise<TitleCardDTO[]> {
      return http.request<TitleCardDTO[]>('/search/suggest', {
        query: { q, limit },
        skipAuth: true,
      })
    },

    /** GET /search/trending — популярные запросы */
    trending(limit = 10): Promise<string[]> {
      return http.request<string[]>('/search/trending', {
        query: { limit },
        skipAuth: true,
        next: { revalidate: 3600 },
      })
    },

    /** GET /search/history — история поиска пользователя */
    searchHistory(): Promise<string[]> {
      return http.request<string[]>('/search/history')
    },

    /** DELETE /search/history */
    clearSearchHistory(): Promise<{ success: boolean }> {
      return http.request<{ success: boolean }>('/search/history', { method: 'DELETE' })
    },

    /** GET /collections — подборки главной страницы */
    collections(): Promise<{
      trending: PaginatedResponse<TitleCardDTO>
      newReleases: PaginatedResponse<TitleCardDTO>
      topRated: PaginatedResponse<TitleCardDTO>
      anime: PaginatedResponse<TitleCardDTO>
    }> {
      return http.request<{
        trending: PaginatedResponse<TitleCardDTO>
        newReleases: PaginatedResponse<TitleCardDTO>
        topRated: PaginatedResponse<TitleCardDTO>
        anime: PaginatedResponse<TitleCardDTO>
      }>('/collections', {
        skipAuth: true,
        next: { revalidate: 300 },
      })
    },
  }
}

export type SearchEndpoints = ReturnType<typeof createSearchEndpoints>