/**
 * Клиент Vibix API (vibix.org).
 *
 * Авторизация — заголовок `Authorization: Bearer <api_key>`, где api_key
 * имеет формат `<publisher_id>|<token>` (см. doc/VIBIX/Api Token ключ.txt).
 *
 * Эндпоинты воспроизведения:
 *   GET /api/v1/publisher/videos/kp/{kpId}     — видео по ID Кинопоиска
 *   GET /api/v1/publisher/videos/imdb/{imdbId} — видео по ID IMDb
 *   GET /api/v1/serials/kp/{kpId}              — сезоны и серии
 *
 * Эндпоинты синхронизации каталога:
 *   GET /api/v1/publisher/videos/links         — список загруженных видео
 *   GET /api/v1/publisher/videos/get_kpids     — только идентификаторы
 */
import { config } from '../../../config.js'
import type { BalancerName, PlayerSource, SeasonInfo } from '@kinoox/api-client'
import type { BalancerPlayerOptions, BalancerTitleInfo, IBalancerService } from '../players.types'
import type {
  VibixGenre,
  VibixListResponse,
  VibixSerialResource,
  VibixVideoResource,
} from './vibix.types'

/** Параметры вставки плеера Vibix в разметку страницы */
export interface VibixEmbedOptions {
  /** data-type: kp | imdb | movie | serial | series */
  type: 'kp' | 'imdb' | 'movie' | 'serial' | 'series'
  /** data-id: значение соответствующего типа */
  id: string | number
  trailer?: 'true' | 'only'
  sync?: boolean
  poster?: boolean
}

/** Фильтры списка загруженных видео — соответствуют Swagger `/videos/links` */
export interface VibixListFilters {
  type?: 'movie' | 'serial'
  category?: number[]
  year?: number[]
  genre?: number[]
  country?: number[]
  tag?: number[]
  voiceover?: number[]
  kpId?: number[]
  /** Только видео с ID Кинопоиска */
  existKpId?: boolean
  /** Без встроенной рекламы */
  noAds?: boolean
  /** Содержит ЛГБТ-контент */
  lgbt?: boolean
  /** Видео доступно (загружено). По умолчанию true */
  isUploaded?: boolean
  page?: number
  limit?: number
}

export class VibixService implements IBalancerService {
  readonly name: BalancerName = 'vibix'
  readonly priority: number

  /** Предохранитель от бесконечного обхода каталога партнёра */
  private static readonly MAX_PAGES = 100
  /**
   * Сервер Vibix принимает `limit` только в диапазоне 20–100.
   * Значения вне диапазона, включая документированное 1000,
   * отклоняются с 422 «Некорректное значение поля: Limit».
   */
  private static readonly MIN_LIMIT = 20
  private static readonly MAX_LIMIT = 100
  /** Значение по умолчанию — как в Swagger */
  private static readonly DEFAULT_LIMIT = 20

  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly publisherId: string

  constructor(options?: {
    baseUrl?: string
    apiKey?: string
    publisherId?: string
    priority?: number
  }) {
    this.baseUrl = (options?.baseUrl ?? config.players.vibix.baseUrl).replace(/\/$/, '')
    this.apiKey = options?.apiKey ?? config.players.vibix.apiKey
    this.publisherId = options?.publisherId ?? config.players.vibix.publisherId
    this.priority = options?.priority ?? config.players.vibix.priority
  }

  get enabled(): boolean {
    return Boolean(this.apiKey)
  }

  // ── Воспроизведение ────────────────────────────────────────

  async getPlayerByKpId(
    kpId: number,
    options?: BalancerPlayerOptions,
  ): Promise<PlayerSource | null> {
    const video = await this.request<VibixVideoResource>(`/api/v1/publisher/videos/kp/${kpId}`)
    if (!video) return null

    // Список серий нужен только сериалам
    const seasons = video.type === 'serial' ? await this.getEpisodes(kpId) : undefined
    return this.toPlayerSource(video, options, seasons)
  }

  async getPlayerByImdbId(
    imdbId: string,
    options?: BalancerPlayerOptions,
  ): Promise<PlayerSource | null> {
    const video = await this.request<VibixVideoResource>(
      `/api/v1/publisher/videos/imdb/${encodeURIComponent(imdbId)}`,
    )
    if (!video) return null

    // kp_id может быть null — тогда список серий не запрашиваем
    const seasons =
      video.type === 'serial' && video.kp_id ? await this.getEpisodes(video.kp_id) : undefined
    return this.toPlayerSource(video, options, seasons)
  }

  /**
   * Публичный API Vibix не содержит эндпоинта «видео по внутреннему ID»:
   * в документации есть только выборки по kp_id и imdb_id. Поэтому здесь
   * возвращаем null, а оркестратор перейдёт к следующему балансеру.
   */
  async getPlayerById(_id: string, _options?: BalancerPlayerOptions): Promise<PlayerSource | null> {
    return null
  }

  async getEpisodes(kpId: number): Promise<SeasonInfo[]> {
    const serial = await this.request<VibixSerialResource>(`/api/v1/serials/kp/${kpId}`)
    if (!serial?.seasons) return []

    return serial.seasons.map((season) => ({
      name: season.name,
      series: serial.seasons
        ? season.series.map((series) => ({ id: series.id, name: series.name }))
        : [],
    }))
  }

  async getTitleInfo(kpId: number): Promise<BalancerTitleInfo | null> {
    const video = await this.request<VibixVideoResource>(`/api/v1/publisher/videos/kp/${kpId}`)
    return video ? this.toTitleInfo(video) : null
  }

  // ── Синхронизация каталога ─────────────────────────────────

  /**
   * Список загруженных видео с фильтрами из Swagger.
   *
   * Внимание: параметр `updated_from`, упомянутый в текстовом описании
   * API, отсутствует в Swagger-схеме `/videos/links`. Фильтрация по дате
   * выполняется на стороне сервиса-потребителя через `uploaded_at`.
   */
  async listVideos(
    filters: VibixListFilters = {},
  ): Promise<{ items: VibixVideoResource[]; total: number; lastPage: number }> {
    const response = await this.requestRaw<{
      data?: VibixVideoResource[]
      meta?: { total?: number; last_page?: number }
    }>(`/api/v1/publisher/videos/links${this.buildListQuery(filters)}`)

    return {
      items: response?.data ?? [],
      total: response?.meta?.total ?? response?.data?.length ?? 0,
      lastPage: response?.meta?.last_page ?? 1,
    }
  }

  /**
   * Полный обход каталога партнёра постранично.
   *
   * Ограничение в 100 страниц защищает от бесконечного цикла, если партнёр
   * вернёт некорректный `last_page`.
   */
  async listAllVideos(filters: VibixListFilters = {}): Promise<VibixVideoResource[]> {
    const collected: VibixVideoResource[] = []

    for (let page = 1; page <= VibixService.MAX_PAGES; page += 1) {
      const batch = await this.listVideos({
        ...filters,
        page,
        limit: filters.limit ?? VibixService.MAX_LIMIT,
      })

      collected.push(...batch.items)

      if (batch.items.length === 0 || page >= batch.lastPage) break
    }

    return collected
  }

  /**
   * Все kp_id, доступные у партнёра — компактный способ поставить задачи
   * синхронизации, не выгружая полные карточки.
   */
  async getKpIds(params: { type?: 'movie' | 'serial'; category?: number[] } = {}): Promise<number[]> {
    const query = new URLSearchParams()
    if (params.type) query.set('type', params.type)
    if (params.category) {
      for (const id of params.category) query.append('category[]', String(id))
    }
    const suffix = query.toString() ? `?${query}` : ''

    const response = await this.requestRaw<{ data?: number[] }>(
      `/api/v1/publisher/videos/get_kpids${suffix}`,
    )
    return response?.data ?? []
  }

  /** Список жанров партнёра с русскими и английскими названиями */
  async getGenres(): Promise<VibixListResponse<VibixGenre>> {
    const response = await this.requestRaw<VibixListResponse<VibixGenre>>(
      '/api/v1/publisher/videos/genres',
    )
    return response ?? { data: [], success: false, message: 'Нет ответа от Vibix' }
  }

  /** Список категорий партнёра */
  async getCategories(): Promise<VibixListResponse<{ id: number; name: string | null }>> {
    const response = await this.requestRaw<
      VibixListResponse<{ id: number; name: string | null }>
    >('/api/v1/publisher/videos/categories')
    return response ?? { data: [], success: false, message: 'Нет ответа от Vibix' }
  }

  // ── Разметка плеера ────────────────────────────────────────

  /**
   * Разметка `<ins>` для вставки плеера на страницу.
   *
   * Соответствует примерам из doc/VIBIX/Показ трейлера.txt и
   * doc/VIBIX/Совместный просмотр.txt.
   */
  buildEmbedMarkup(options: VibixEmbedOptions): string {
    const attributes = [
      `data-publisher-id="${this.publisherId}"`,
      `data-type="${options.type}"`,
      `data-id="${options.id}"`,
    ]

    if (options.trailer) attributes.push(`data-trailer="${options.trailer}"`)
    if (options.sync) attributes.push('data-sync="true"')
    if (options.poster) attributes.push('data-poster="true"')

    return `<ins ${attributes.join(' ')}></ins>`
  }

  // ── Внутреннее ─────────────────────────────────────────────

  /** Собирает query-строку для `/videos/links` по документированным параметрам */
  private buildListQuery(filters: VibixListFilters): string {
    const query = new URLSearchParams()

    if (filters.type) query.set('type', filters.type)

    // Массивы передаются как `param[]=1&param[]=2`
    const arrayParams: Array<[string, number[] | undefined]> = [
      ['category[]', filters.category],
      ['year[]', filters.year],
      ['genre[]', filters.genre],
      ['country[]', filters.country],
      ['tag[]', filters.tag],
      ['voiceover[]', filters.voiceover],
      ['kp_id[]', filters.kpId],
    ]
    for (const [key, values] of arrayParams) {
      if (!values) continue
      for (const value of values) query.append(key, String(value))
    }

    // Логические параметры. Сервер Vibix принимает только 0/1:
    // `true` и `false` отклоняются с 422, хотя Swagger заявляет boolean.
    // Для is_uploaded значение по умолчанию — 1, поэтому отправляем только при явном false.
    if (filters.existKpId !== undefined) query.set('exist_kp_id', filters.existKpId ? '1' : '0')
    if (filters.noAds !== undefined) query.set('no_ads', filters.noAds ? '1' : '0')
    if (filters.lgbt !== undefined) query.set('lgbt', filters.lgbt ? '1' : '0')
    if (filters.isUploaded !== undefined) query.set('is_uploaded', filters.isUploaded ? '1' : '0')

    if (filters.page) query.set('page', String(filters.page))

    // Сервер принимает limit только в диапазоне 20–100
    query.set(
      'limit',
      String(
        Math.min(
          Math.max(filters.limit ?? VibixService.DEFAULT_LIMIT, VibixService.MIN_LIMIT),
          VibixService.MAX_LIMIT,
        ),
      ),
    )

    const serialized = query.toString()
    return serialized ? `?${serialized}` : ''
  }

  private toPlayerSource(
    video: VibixVideoResource,
    options?: BalancerPlayerOptions,
    seasons?: SeasonInfo[],
  ): PlayerSource {
    // data-type для разметки: сериал — series, всё остальное — movie
    const embedType = video.type === 'serial' ? 'serial' : 'movie'

    // data-id и data-type надёжно известны только из embed_code: `video.id`
    // это идентификатор записи в базе Vibix, а в разметке используется другой
    // ID плеера. Например, для «Матрицы» video.id = 938184, а data-id = 4469.
    // Подстановка любого из наших идентификаторов даёт пустой плеер.
    const parsed = this.parseEmbedCode(video)

    const markup = this.buildEmbedMarkup({
      type: parsed.type ?? embedType,
      id: parsed.id ?? video.id,
      trailer: options?.trailerOnly ? 'only' : options?.trailer ? 'true' : undefined,
      sync: options?.sync,
      poster: options?.poster,
    })

    return {
      balancer: this.name,
      iframeUrl: video.iframe_url || this.buildPlayerUrl(video, options),
      quality: video.quality,
      embedCode: markup,
      episodes: seasons,
    }
  }

  /**
   * Разбирает `embed_code` в атрибуты разметки.
   *
   * Vibix отдаёт его в виде строки без тега:
   * `data-publisher-id="674093403" data-type="movie" data-id="4469"`.
   * Это единственный достоверный источник `data-id` — он не совпадает
   * ни с kp_id, ни с video.id.
   */
  parseEmbedCode(video: VibixVideoResource): {
    publisherId: string | null
    type: 'kp' | 'imdb' | 'movie' | 'series' | 'serial' | null
    id: string | null
  } {
    const source = video.embed_code ?? ''

    const publisher = source.match(/data-publisher-id="([^"]+)"/)
    const type = source.match(/data-type="([^"]+)"/)
    const id = source.match(/data-id="([^"]+)"/)

    const allowedTypes = ['kp', 'imdb', 'movie', 'series', 'serial'] as const
    const parsedType = type?.[1]

    return {
      publisherId: publisher?.[1] ?? null,
      type: parsedType && (allowedTypes as readonly string[]).includes(parsedType)
        ? (parsedType as 'kp' | 'imdb' | 'movie' | 'series' | 'serial')
        : null,
      id: id?.[1] ?? null,
    }
  }

  /**
   * Страница-обёртка для iframe с плеером Vibix.
   *
   * Прямой ссылки на фрейм API не отдаёт, поэтому клиент загружает
   * HTML-документ, который подключает SDK партнёра и вставляет разметку
   * `<ins>` с атрибутами текущего видео.
   */
  private buildPlayerUrl(video: VibixVideoResource, options?: BalancerPlayerOptions): string {
    const params = new URLSearchParams()
    const parsed = this.parseEmbedCode(video)

    params.set('publisher', parsed.publisherId ?? this.publisherId)
    params.set('type', parsed.type ?? (video.type === 'serial' ? 'serial' : 'movie'))
    // data-id берём из embed_code: он отличается и от kp_id, и от video.id
    params.set('id', parsed.id ?? String(video.id))
    params.set('title', video.name_rus ?? video.name)

    if (video.kp_id) params.set('kp', String(video.kp_id))
    if (video.imdb_id) params.set('imdb', video.imdb_id)
    if (video.poster_url) params.set('poster', video.poster_url)
    if (options?.season) params.set('season', String(options.season))
    if (options?.episode) params.set('episode', String(options.episode))
    if (options?.trailerOnly) params.set('trailer', 'only')
    else if (options?.trailer) params.set('trailer', 'true')
    if (options?.sync) params.set('sync', '1')

    return `${config.server.publicUrl.replace('/api/v1', '')}/api/v1/players/vibix/embed?${params.toString()}`
  }

  private toTitleInfo(video: VibixVideoResource): BalancerTitleInfo {
    return {
      balancerId: String(video.id),
      kpId: video.kp_id,
      imdbId: video.imdb_id,
      // name уже содержит русское название либо английское, если русского нет
      name: video.name_rus ?? video.name,
      nameRus: video.name_rus,
      nameEng: video.name_eng,
      nameOriginal: video.name_original,
      type: video.type,
      year: video.year,
      posterUrl: video.poster_url,
      backdropUrl: video.backdrop_url,
      duration: video.duration,
      quality: video.quality,
      kpRating: video.kp_rating,
      imdbRating: video.imdb_rating,
      genres: video.genre ?? [],
      countries: video.country ?? [],
      description: video.description,
      descriptionShort: video.description_short,
      iframeUrl: video.iframe_url,
      embedCode: video.embed_code ?? null,
      uploadedAt: video.uploaded_at,
    }
  }

  private async request<T>(path: string): Promise<T | null> {
    return this.requestRaw<T>(path)
  }

  private async requestRaw<T>(path: string): Promise<T | null> {
    if (!this.enabled) return null

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), config.players.timeoutMs)

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
      })

      // 404 у Vibix означает «видео не найдено» — это не ошибка
      if (response.status === 404) return null
      if (!response.ok) return null

      return (await response.json()) as T
    } catch {
      // Сетевые ошибки и таймауты трактуем как «источник недоступен»
      return null
    } finally {
      clearTimeout(timeout)
    }
  }
}
