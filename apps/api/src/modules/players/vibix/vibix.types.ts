/**
 * Типы ответов Vibix API (vibix.org).
 * Источник: doc/VIBIX/Vibix API Documentation.txt
 */

export interface VibixPerson {
  id: number
  name: string
  name_eng?: string | null
  name_anyway?: string | null
  occupation: string
}

export interface VibixVoiceover {
  id: number
  name: string
}

export interface VibixTag {
  id: number
  code: string
  name: string
}

/** Ресурс видео: /api/v1/publisher/videos/kp/{kpId} */
export interface VibixVideoResource {
  id: number
  name: string
  name_rus: string | null
  name_eng: string | null
  name_original: string | null
  type: 'movie' | 'serial'
  year: number | null
  kp_id: number | null
  /** @deprecated Используйте kp_id */
  kinopoisk_id?: number | null
  imdb_id: string | null
  kp_rating: number | null
  kp_votes?: number | null
  imdb_rating: number | null
  imdb_votes?: number | null
  iframe_url: string
  embed_code?: string
  persons?: VibixPerson[] | null
  voiceovers?: VibixVoiceover[] | null
  tags?: VibixTag[] | null
  poster_url: string | null
  backdrop_url: string | null
  duration: number | null
  quality: string
  genre: string[] | null
  country: string[] | null
  description: string | null
  description_short: string | null
  /** Дата изменения записи — используется для инкрементальной синхронизации */
  updated_at?: string | null
  uploaded_at: string | null
}

/** Ответ /api/v1/publisher/videos/links */
export interface VibixLinksResponse {
  data: VibixVideoResource[]
  links: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
  meta: {
    current_page: number
    from: number
    last_page: number
    links: Array<{ url: string | null; label: string; active: boolean }>
    path: string
    per_page: number
    to: number
    total: number
  }
  success: boolean
  message: string
}

/** Ответ /api/v1/publisher/videos/get_kpids */
export interface VibixKpIdsResponse {
  data: number[]
  success: boolean
  message: string
  status: number
}

/** Ответ /api/v1/publisher/videos/categories */
export interface VibixCategory {
  id: number
  name: string | null
}

/** Элемент списка get_kpids при постраничной выдаче */
export interface VibixKpIdsPage {
  data: number[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

/** Ответ /api/v1/publisher/videos/genres */
export interface VibixGenre {
  id: number
  name: string | null
  name_eng: string | null
}

/** Ответ /api/v1/publisher/videos/countries */
export interface VibixCountry {
  id: number
  name: string | null
  name_eng: string | null
  code: string | null
}

/** Ответ /api/v1/publisher/videos/voiceovers */
export interface VibixVoiceoverName {
  id: number
  name: string | null
}

/** Ответ /api/v1/publisher/videos/occupations */
export interface VibixOccupation {
  id: number | string
  name: string
}

export interface VibixListResponse<T> {
  data: T[]
  success: boolean
  message: string
}

/** Ресурс серии */
export interface VibixSeries {
  id: number
  name: string
}

/** Сезон */
export interface VibixSeason {
  name: string
  series: VibixSeries[]
}

/** Ответ /api/v1/serials/kp/{kpId} */
export interface VibixSerialResource {
  id: number
  name: string
  seasons: VibixSeason[] | null
}

/** Статистика партнёра: /api/v1/publisher/statistics */
export interface VibixStatisticsItem {
  group_value: string
  player_starts: number
  ads_views: number
  ads_clicks: number
  revenue: number
  banner_show: number
  banner_click: number
  brand_show: number
  brand_click: number
  sticker_show: number
  sticker_click: number
  flyroll_show: number
  flyroll_click: number
}

export interface VibixStatisticsResponse {
  success: boolean
  data: {
    items: VibixStatisticsItem[]
    totals: Omit<VibixStatisticsItem, 'group_value'>
    pagination: {
      current_page: number
      per_page: number
      total: number
      last_page: number
    }
  }
}

/** Ошибка Vibix */
export interface VibixErrorResponse {
  success: false
  message: string
  status: number
}
