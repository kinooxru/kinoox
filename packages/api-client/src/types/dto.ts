/**
 * KINOOX — общие типы API и DTO.
 * Единый контракт для сайта, мобильного и десктопного приложений.
 */

/** Формат ответа всех эндпоинтов API */
export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: string | null
}

/** Метаданные пагинации */
export interface PaginationMeta {
  page: number
  perPage: number
  total: number
  totalPages: number
}

/** Постраничный ответ */
export interface PaginatedResponse<T> {
  items: T[]
  meta: PaginationMeta
}

/** Тип тайтла */
export type TitleType = 'movie' | 'serial' | 'cartoon' | 'anime'

/** Статус выхода */
export type TitleStatus = 'ongoing' | 'released' | 'announced'

/** Платформы приложений */
export type AppPlatform = 'android' | 'ios' | 'windows' | 'macos' | 'linux'

/** Балансеры видео */
export type BalancerName = 'vibix' | 'veoveo'

export type SortOption = 'rating' | 'year' | 'popular' | 'newest'

export interface TitleDTO {
  id: number
  kpId: number | null
  imdbId: string | null
  type: TitleType
  title: string
  originalTitle: string | null
  description: string | null
  posterUrl: string
  backdropUrl: string | null
  year: number
  ratingKp: number | null
  ratingImdb: number | null
  duration: number | null
  countries: string[]
  genres: string[]
  actors: string[]
  directors: string[]
  status: TitleStatus
  /** Количество серий, если тайтл — сериал/аниме */
  episodesCount?: number
  seasonsCount?: number
  createdAt: string
  updatedAt: string
}

/** Карточка тайтла для сеток каталога — облегчённый DTO */
export interface TitleCardDTO {
  id: number
  type: TitleType
  title: string
  originalTitle: string | null
  posterUrl: string
  year: number
  ratingKp: number | null
  genres: string[]
  status: TitleStatus
}

export interface EpisodeDTO {
  id: number
  titleId: number
  season: number
  episode: number
  name: string | null
}

export interface SourceDTO {
  id: number
  titleId: number
  balancer: BalancerName
  balancerId: string
  quality: string
  priority: number
}

/** Информация о серии внутри источника */
export interface EpisodeInfo {
  id: number
  name: string
}

/** Сезон внутри источника */
export interface SeasonInfo {
  name: string
  series: EpisodeInfo[]
}

/** Источник воспроизведения, готовый для iframe */
export interface PlayerSource {
  balancer: BalancerName
  iframeUrl: string
  quality: string
  embedCode?: string
  episodes?: SeasonInfo[]
}

/** Ответ эндпоинта /titles/:id/sources */
export interface TitleSourcesDTO {
  titleId: number
  /** Источники по приоритету: сначала Vibix, затем VeoVeo */
  sources: PlayerSource[]
  /** Первый источник, который следует открыть плееру */
  primary: PlayerSource | null
}

export interface UserDTO {
  id: number
  email: string
  username: string
  avatarUrl: string | null
  role: string
  createdAt: string
}

export interface AuthTokensDTO {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface AuthResultDTO {
  user: UserDTO
  tokens: AuthTokensDTO
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  username: string
  password: string
}

export interface RefreshInput {
  refreshToken: string
}

export type BookmarkStatus = 'watching' | 'planned' | 'completed' | 'dropped' | 'on_hold'

export interface BookmarkDTO {
  id: number
  userId: number
  titleId: number
  status: BookmarkStatus
  lastSeason: number | null
  lastEpisode: number | null
  createdAt: string
  title: TitleCardDTO
}

export interface CreateBookmarkInput {
  titleId: number
  status?: BookmarkStatus
  lastSeason?: number
  lastEpisode?: number
}

export interface UpdateBookmarkInput {
  status?: BookmarkStatus
  lastSeason?: number
  lastEpisode?: number
}

export interface ViewHistoryDTO {
  id: number
  userId: number
  titleId: number
  season: number | null
  episode: number | null
  watchedAt: string
  title: TitleCardDTO
}

export interface CreateHistoryInput {
  titleId: number
  season?: number
  episode?: number
}

export interface CommentDTO {
  id: number
  titleId: number
  userId: number
  parentId: number | null
  text: string
  createdAt: string
  user: {
    id: number
    username: string
    avatarUrl: string | null
  }
  replies?: CommentDTO[]
}

export interface CreateCommentInput {
  text: string
  parentId?: number
}

export interface SearchResultDTO {
  query: string
  items: TitleCardDTO[]
  meta: PaginationMeta
}

/** Параметры фильтрации каталога */
export interface TitleFilter {
  type?: TitleType
  genre?: string
  year?: number
  sort?: SortOption
  page?: number
  perPage?: number
}

export interface AppVersionDTO {
  platform: AppPlatform
  version: string
  url: string
  size: string
  minimumOs: string
  changelog: string[]
  releaseDate: string
}

export interface DownloadPlatformDTO {
  platform: AppPlatform
  title: string
  description: string
  version: string
  size: string
  minimumOs: string
  features: string[]
  downloads: Array<{
    label: string
    url: string
    format: string
  }>
  /** Присутствует только у мобильных платформ */
  qrCodeUrl: string | null
  screenshots: string[]
}

export interface DownloadsListDTO {
  platforms: DownloadPlatformDTO[]
  updatedAt: string
}

export interface ChangelogEntry {
  version: string
  releaseDate: string
  platform: AppPlatform
  changes: string[]
}

export interface NotificationDTO {
  id: string
  type: 'new_episode' | 'new_title' | 'system'
  titleId: number | null
  titleName: string
  message: string
  createdAt: string
  read: boolean
}

export interface HealthDTO {
  status: 'ok' | 'degraded'
  uptime: number
  version: string
  services: {
    database: 'up' | 'down'
    redis: 'up' | 'down'
  }
  timestamp: string
}

/** Скидка-тип для пары фильтров */
export interface FilterOptionsDTO {
  genres: string[]
  years: number[]
  countries: string[]
}

/** Реальная статистика проекта для главного баннера и метрик */
export interface SystemStatsDTO {
  titlesCount: number
  usersCount: number
  averageRating: number
  downloadsCount: number
}

