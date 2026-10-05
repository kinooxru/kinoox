/**
 * Типы VeoVeo Webmaster API.
 * Источник: doc/VEOVEO/Webmaster API Руководство по применению.txt
 */

export interface VeoveoContentType {
  id: number
  name: string
  slug: string
}

export interface VeoveoGenre {
  id: number
  name: string
  slug: string
}

export interface VeoveoCountry {
  id: number
  name: string
  slug: string
}

export interface VeoveoLanguage {
  id: number
  name: string
  slug: string
}

export interface VeoveoRating {
  rating: number
  votes: number
}

/** Упрощённая карточка контента */
export interface VeoveoContentLightDto {
  id: number
  title: string
  originalTitle: string
  posterUrl?: string
  year: number
  duration?: number
  kinopoiskId?: number
  contentType: VeoveoContentType
  genres: VeoveoGenre[]
  countries: VeoveoCountry[]
  ageRestriction: string
  ratings: Record<string, VeoveoRating>
  createdAt: string
  updatedAt: string
  audioTracks?: string
  seasonsCount?: number
  episodesCount?: number
  episodesBySeason?: Record<string, number>
}

/** Подробная карточка контента */
export interface VeoveoContentDetailDto extends VeoveoContentLightDto {
  description: string
  endYear?: number
  cast?: string
  directors?: string
  screenwriters?: string
  producers?: string
  operators?: string
  composers?: string
  artists?: string
  editors?: string
  voiceAuthors?: string
  languages?: VeoveoLanguage[]
  subtitles?: VeoveoLanguage[]
  premiereAt?: string
  lastSeasonPremiereAt?: string
}

export interface VeoveoPageMeta {
  page: number
  total: number
  hasNextPage: boolean
  pageSize: number
  pages: number
}

export interface VeoveoPaginationWrapper<T> {
  data: T[]
  meta: VeoveoPageMeta
}

export interface VeoveoPaginationDto {
  page: number
  pageSize: number
  type: 'page'
  order?: 'ASC' | 'DESC'
  sortBy?: string
}

export interface VeoveoContentFilterDto {
  pagination: VeoveoPaginationDto
  ids?: number[]
  contentTypeId?: number[]
  kinopoiskId?: number[]
  genreId?: number[]
  ageRestriction?: string
  countryId?: number[]
  languageId?: number[]
  year?: number[]
  textFilter?: string
  kinopoiskRating?: {
    from: number
    to: number
  }
}

/** Ошибка VeoVeo */
export interface VeoveoErrorResponse {
  success?: false
  message?: string
  status?: number
}
