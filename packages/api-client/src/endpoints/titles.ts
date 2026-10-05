import type { HttpClient } from '../http/client'
import type {
  EpisodeDTO,
  FilterOptionsDTO,
  PaginatedResponse,
  PlayerSource,
  SourceDTO,
  TitleCardDTO,
  TitleDTO,
  TitleFilter,
  TitleSourcesDTO,
} from '../types/dto'

export function createTitlesEndpoints(http: HttpClient) {
  return {
    /** GET /titles */
    list(filter: TitleFilter = {}): Promise<PaginatedResponse<TitleCardDTO>> {
      return http.request<PaginatedResponse<TitleCardDTO>>('/titles', {
        query: {
          type: filter.type,
          genre: filter.genre,
          year: filter.year,
          sort: filter.sort,
          page: filter.page,
          perPage: filter.perPage,
        },
        skipAuth: true,
        next: { revalidate: 300 },
      })
    },

    /** GET /titles/:id */
    byId(id: number): Promise<TitleDTO> {
      return http.request<TitleDTO>(`/titles/${id}`, {
        skipAuth: true,
        next: { revalidate: 600, tags: [`title:${id}`] },
      })
    },

    /** GET /titles/:id/episodes */
    episodes(id: number): Promise<EpisodeDTO[]> {
      return http.request<EpisodeDTO[]>(`/titles/${id}/episodes`, {
        skipAuth: true,
        next: { revalidate: 600, tags: [`title:${id}`] },
      })
    },

    /** GET /titles/:id/sources */
    sources(id: number): Promise<TitleSourcesDTO> {
      return http.request<TitleSourcesDTO>(`/titles/${id}/sources`, {
        skipAuth: true,
      })
    },

    /** GET /titles/:id/related — похожие тайтлы */
    related(id: number, limit = 12): Promise<PaginatedResponse<TitleCardDTO>> {
      return http.request<PaginatedResponse<TitleCardDTO>>(`/titles/${id}/related`, {
        query: { limit },
        skipAuth: true,
        next: { revalidate: 600 },
      })
    },

    /** GET /titles/:id/similar — «сейчас смотрят» */
    similar(id: number, limit = 12): Promise<PaginatedResponse<TitleCardDTO>> {
      return http.request<PaginatedResponse<TitleCardDTO>>(`/titles/${id}/similar`, {
        query: { limit },
        skipAuth: true,
        next: { revalidate: 600 },
      })
    },

    /** GET /filters — доступные жанры, годы, страны */
    filters(): Promise<FilterOptionsDTO> {
      return http.request<FilterOptionsDTO>('/filters', {
        skipAuth: true,
        next: { revalidate: 3600 },
      })
    },

    /** GET /titles/:id/sources/:balancer — конкретный балансер */
    sourceByBalancer(id: number, balancer: PlayerSource['balancer']): Promise<PlayerSource | null> {
      return http.request<PlayerSource | null>(`/titles/${id}/sources/${balancer}`, {
        skipAuth: true,
      })
    },

    /** GET /titles/:id/source-records — сохранённые записи источников */
    sourceRecords(id: number): Promise<SourceDTO[]> {
      return http.request<SourceDTO[]>(`/titles/${id}/source-records`, {
        skipAuth: true,
      })
    },
  }
}

export type TitlesEndpoints = ReturnType<typeof createTitlesEndpoints>