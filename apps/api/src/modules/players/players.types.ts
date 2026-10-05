/**
 * Контракт балансера видео.
 *
 * Любой балансер (Vibix, VeoVeo, будущие) реализует этот интерфейс,
 * поэтому оркестратор умеет перебирать их по приоритету, не зная деталей.
 */
import type { BalancerName, PlayerSource, SeasonInfo } from '@kinoox/api-client'

export interface BalancerTitleInfo {
  /** Внутренний ID видео на стороне балансера */
  balancerId: string
  kpId: number | null
  imdbId: string | null
  name: string
  nameRus: string | null
  nameEng: string | null
  nameOriginal: string | null
  type: 'movie' | 'serial'
  year: number | null
  endYear?: number | null
  posterUrl: string | null
  backdropUrl: string | null
  duration: number | null
  quality: string
  kpRating: number | null
  imdbRating: number | null
  genres: string[]
  countries: string[]
  description: string | null
  descriptionShort: string | null
  iframeUrl: string
  embedCode: string | null
  uploadedAt: string | null
}

export interface IBalancerService {
  /** Имя балансера — совпадает со значением в БД и в PlayerSource */
  readonly name: BalancerName
  /** Значение приоритета: меньше — раньше пробуем */
  readonly priority: number
  /** Балансер включён (есть ключ, не отключён конфигурацией) */
  readonly enabled: boolean

  /** Получить источник воспроизведения по ID Кинопоиска */
  getPlayerByKpId(kpId: number, options?: BalancerPlayerOptions): Promise<PlayerSource | null>

  /** Получить источник по IMDB ID */
  getPlayerByImdbId(imdbId: string, options?: BalancerPlayerOptions): Promise<PlayerSource | null>

  /** Полный плеер по внутреннему ID балансера */
  getPlayerById(id: string, options?: BalancerPlayerOptions): Promise<PlayerSource | null>

  /** Сезоны и серии */
  getEpisodes(kpId: number): Promise<SeasonInfo[]>

  /** Подробная информация о тайтле (для синхронизации каталога) */
  getTitleInfo(kpId: number): Promise<BalancerTitleInfo | null>
}

export interface BalancerPlayerOptions {
  /** Показать только трейлер, если полной версии нет (data-trailer="true") */
  trailer?: boolean
  /** Показывать трейлер всегда (data-trailer="only") */
  trailerOnly?: boolean
  /** Включить совместный просмотр (data-sync="true") */
  sync?: boolean
  /** Показать постер до запуска (data-poster="true") */
  poster?: boolean
  /** Сезон и серия для сериалов */
  season?: number
  episode?: number
}
