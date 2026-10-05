/**
 * Типы модуля каталога.
 */
import type { TitleStatus, TitleType } from '@kinoox/api-client'

export interface TitleListFilter {
  type?: TitleType
  genre?: string
  country?: string
  year?: number
  /** Минимальный рейтинг Кинопоиска */
  minRating?: number
  sort: TitleSort
  page: number
  perPage: number
}

export type TitleSort = 'rating' | 'year' | 'popular' | 'newest'

export interface TitleEpisodeInput {
  season: number
  episode: number
  name?: string | null
  externalId?: string | null
}

export interface TitleSourceInput {
  balancer: string
  balancerId: string
  quality: string
  priority: number
}

/** Данные для создания/обновления тайтла при синхронизации */
export interface TitleUpsertInput {
  kpId?: number | null
  imdbId?: string | null
  type: TitleType
  title: string
  originalTitle?: string | null
  description?: string | null
  posterUrl: string
  backdropUrl?: string | null
  year: number
  ratingKp?: number | null
  ratingImdb?: number | null
  duration?: number | null
  countries: string[]
  genres: string[]
  actors?: string[]
  directors?: string[]
  status: TitleStatus
}

export interface TitleWithDetails {
  id: number
  seasonsCount: number
}
