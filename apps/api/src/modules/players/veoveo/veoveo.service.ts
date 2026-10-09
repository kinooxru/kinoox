/**
 * Клиент VeoVeo Webmaster API.
 *
 * Авторизация — `Authorization: Bearer <token>`, токен берётся из личного кабинета.
 * Документация: doc/VEOVEO/Webmaster API Руководство по применению.txt
 */
import { config } from '../../../config.js'
import type { BalancerName, PlayerSource, SeasonInfo } from '@kinoox/api-client'
import type { BalancerPlayerOptions, BalancerTitleInfo, IBalancerService } from '../players.types'
import type {
  VeoveoContentDetailDto,
  VeoveoContentFilterDto,
  VeoveoContentLightDto,
  VeoveoCountry,
  VeoveoGenre,
  VeoveoPaginationWrapper,
} from './veoveo.types'

const PLAYER_DOMAIN_ACTUALIZE_URL = 'https://super-puper.che-bur-net.cc/actualize?category=player-entry'
const PLAYER_DOMAIN_REWRITE_SCRIPT = 'https://super-puper.che-bur-net.cc/vv2.js'
const PLAYER_DOMAIN_CACHE_MS = 10 * 60 * 1000

function normalizePlayerDomain(value: string): string | null {
  try {
    const url = new URL(value.includes('://') ? value : `https://${value}`)
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/') return null
    return url.origin
  } catch {
    return null
  }
}

export class VeoveoService implements IBalancerService {
  readonly name: BalancerName = 'veoveo'
  readonly priority: number

  private readonly baseUrl: string
  private readonly catalogSyncBaseUrl: string
  private readonly configuredPlayerDomain: string | null
  private readonly token: string
  private resolvedPlayerDomain: string | null = null
  private playerDomainExpiresAt = 0
  private playerDomainRequest: Promise<string | null> | null = null

  constructor(options?: {
    baseUrl?: string
    catalogSyncBaseUrl?: string
    playerDomain?: string
    token?: string
    priority?: number
  }) {
    this.baseUrl = (options?.baseUrl ?? config.players.veoveo.baseUrl).replace(/\/$/, '')
    this.catalogSyncBaseUrl = (options?.catalogSyncBaseUrl ?? config.players.veoveo.catalogSyncBaseUrl).replace(/\/$/, '')
    this.configuredPlayerDomain = options?.playerDomain
      ? normalizePlayerDomain(options.playerDomain)
      : normalizePlayerDomain(config.players.veoveo.playerDomain)
    this.token = options?.token ?? config.players.veoveo.token
    this.priority = options?.priority ?? config.players.veoveo.priority
  }

  get enabled(): boolean {
    return Boolean(this.token)
  }

  // ── IBalancerService ───────────────────────────────────────

  /**
   * VeoVeo не отдаёт iframe-URL через Webmaster API: плеер подключается
   * партнёрским скриптом по kinopoiskId. Поэтому формируем параметры встраивания,
   * которые сайт использует для инициализации плеера.
   */
  async getPlayerByKpId(
    kpId: number,
    options?: BalancerPlayerOptions,
  ): Promise<PlayerSource | null> {
    const iframeUrl = await this.buildPlayerUrl({ kp: kpId }, options)
    if (!iframeUrl) return null

    // Плеер принимает kp напрямую, поэтому каталог не должен блокировать запуск видео.
    const seasons = await this.getEpisodes(kpId)
    return {
      balancer: this.name,
      iframeUrl,
      quality: 'auto',
      embedCode: this.buildEmbedMarkup(iframeUrl),
      episodes: seasons.length > 0 ? seasons : undefined,
    }
  }

  async getPlayerByImdbId(imdbId: string, options?: BalancerPlayerOptions): Promise<PlayerSource | null> {
    const iframeUrl = await this.buildPlayerUrl({ imdb: imdbId }, options)
    if (!iframeUrl) return null
    return {
      balancer: this.name,
      iframeUrl,
      quality: 'auto',
      embedCode: this.buildEmbedMarkup(iframeUrl),
    }
  }

  async getPlayerById(id: string, options?: BalancerPlayerOptions): Promise<PlayerSource | null> {
    if (!id.trim()) return null
    const iframeUrl = await this.buildPlayerUrl({ movieId: id }, options)
    if (!iframeUrl) return null
    return {
      balancer: this.name,
      iframeUrl,
      quality: 'auto',
      embedCode: this.buildEmbedMarkup(iframeUrl),
    }
  }

  async getEpisodes(kpId: number): Promise<SeasonInfo[]> {
    const content = await this.findByKinopoiskId(kpId)
    if (!content?.episodesBySeason || content.contentType?.slug === 'movie') return []

    return Object.entries(content.episodesBySeason)
      .filter(([seasonNumber]) => Number(seasonNumber) > 0)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([seasonNumber, episodesCount]) => ({
        name: `Сезон ${seasonNumber}`,
        series: Array.from({ length: episodesCount }, (_, index) => ({
          id: index + 1,
          name: `Серия ${index + 1}`,
        })),
      }))
  }

  async getTitleInfo(kpId: number): Promise<BalancerTitleInfo | null> {
    const content = await this.findByKinopoiskId(kpId)
    if (!content) return null

    const kpRating = content.ratings?.kinopoisk?.rating ?? null

    return {
      balancerId: String(content.id),
      kpId: content.kinopoiskId ?? kpId,
      imdbId: null,
      name: content.title,
      nameRus: content.title,
      nameEng: null,
      nameOriginal: content.originalTitle,
      type: content.contentType?.slug === 'series' ? 'serial' : 'movie',
      year: content.year ?? null,
      endYear: content.endYear ?? null,
      posterUrl: content.posterUrl ?? null,
      backdropUrl: null,
      duration: content.duration ?? null,
      quality: 'auto',
      kpRating,
      imdbRating: content.ratings?.imdb?.rating ?? null,
      genres: (content.genres ?? []).map((genre) => genre.name),
      countries: (content.countries ?? []).map((country) => country.name),
      description: content.description ?? null,
      descriptionShort: content.description ?? null,
      iframeUrl: (await this.buildPlayerUrl({ movieId: String(content.id) })) ?? '',
      embedCode: null,
      uploadedAt: content.updatedAt ?? null,
    }
  }

  // ── Дополнительные методы каталога ─────────────────────────

  /** POST /v1/contents — облегчённый список для отображения */
  async listContents(filter: VeoveoContentFilterDto): Promise<VeoveoPaginationWrapper<VeoveoContentLightDto>> {
    const response = await this.post<VeoveoPaginationWrapper<VeoveoContentLightDto>>(
      '/v1/contents',
      filter,
    )
    return response ?? { data: [], meta: { page: 1, total: 0, hasNextPage: false, pageSize: 0, pages: 0 } }
  }

  /** POST /v1/contents/details — подробные данные для синхронизации */
  async listContentDetails(
    filter: VeoveoContentFilterDto,
  ): Promise<VeoveoPaginationWrapper<VeoveoContentDetailDto>> {
    const response = await this.post<VeoveoPaginationWrapper<VeoveoContentDetailDto>>(
      '/v1/contents/details',
      filter,
      this.catalogSyncBaseUrl,
    )
    return response ?? { data: [], meta: { page: 1, total: 0, hasNextPage: false, pageSize: 0, pages: 0 } }
  }

  /** GET /v1/contents/{id} */
  async getContentById(id: number): Promise<VeoveoContentDetailDto | null> {
    return this.get<VeoveoContentDetailDto>(`/v1/contents/${id}`)
  }

  /** GET /v1/filters/genres */
  async getGenres(contentTypeId?: number): Promise<VeoveoGenre[]> {
    const suffix = contentTypeId ? `?content-type-id=${contentTypeId}` : ''
    return (await this.get<VeoveoGenre[]>(`/v1/filters/genres${suffix}`)) ?? []
  }

  /** GET /v1/filters/countries */
  async getCountries(): Promise<VeoveoCountry[]> {
    return (await this.get<VeoveoCountry[]>('/v1/filters/countries')) ?? []
  }

  /** GET /v1/filters/years */
  async getYears(): Promise<number[]> {
    return (await this.get<number[]>('/v1/filters/years')) ?? []
  }

  /** GET /v1/filters/content-types */
  async getContentTypes(): Promise<Array<{ id: number; name: string; slug: string }>> {
    return (await this.get<Array<{ id: number; name: string; slug: string }>>('/v1/filters/content-types')) ?? []
  }

  /** Поиск контента по ID Кинопоиска */
  async findByKinopoiskId(kpId: number): Promise<VeoveoContentDetailDto | null> {
    const page = await this.listContents({
      pagination: { page: 1, pageSize: 1, type: 'page' },
      kinopoiskId: [kpId],
    })
    const contentId = page.data[0]?.id
    return contentId === undefined ? null : this.getContentById(contentId)
  }

  /** Базовый iframe VeoVeo: /balancer-api/iframe с токеном сайта */
  private async buildPlayerUrl(
    identifier: { kp?: number; imdb?: string; movieId?: string },
    options?: BalancerPlayerOptions,
  ): Promise<string | null> {
    if (!this.token) return null
    const domain = await this.resolvePlayerDomain()
    if (!domain) return null

    const params = new URLSearchParams({
      token: this.token,
      disable_checking_available: '1',
    })
    if (identifier.movieId !== undefined) params.set('movie_id', identifier.movieId)
    else if (identifier.kp !== undefined) params.set('kp', String(identifier.kp))
    else if (identifier.imdb !== undefined) params.set('imdb', identifier.imdb)
    else return null

    if (options?.season) params.set('season', String(options.season))
    if (options?.episode) params.set('episode', String(options.episode))
    return `${domain}/balancer-api/iframe?${params.toString()}`
  }

  /** Iframe вместе со скриптом VeoVeo для автоматической замены домена */
  private buildEmbedMarkup(iframeUrl: string): string {
    const escapedUrl = iframeUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    return `<iframe data-player="vv" style="width:100%;height:100%" src="${escapedUrl}" allow="fullscreen *"></iframe>\n<script src="${PLAYER_DOMAIN_REWRITE_SCRIPT}"></script>`
  }

  private async resolvePlayerDomain(): Promise<string | null> {
    if (this.resolvedPlayerDomain && Date.now() < this.playerDomainExpiresAt) {
      return this.resolvedPlayerDomain
    }
    if (this.playerDomainRequest) return this.playerDomainRequest

    this.playerDomainRequest = (async () => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), Math.min(config.players.timeoutMs, 5000))
      try {
        const response = await fetch(PLAYER_DOMAIN_ACTUALIZE_URL, { signal: controller.signal })
        if (!response.ok) throw new Error(`VeoVeo domain lookup failed: ${response.status}`)
        const text = await response.text()
        let domain: string | null = null
        try {
          const parsed: unknown = JSON.parse(text)
          if (typeof parsed === 'object' && parsed !== null && 'domain' in parsed && typeof parsed.domain === 'string') {
            domain = normalizePlayerDomain(parsed.domain)
          } else if (typeof parsed === 'string') {
            domain = normalizePlayerDomain(parsed)
          }
        } catch {
          domain = normalizePlayerDomain(text.trim())
        }

        if (!domain) throw new Error('VeoVeo returned an invalid player domain')
        this.resolvedPlayerDomain = domain
        this.playerDomainExpiresAt = Date.now() + PLAYER_DOMAIN_CACHE_MS
        return domain
      } catch {
        return this.resolvedPlayerDomain ?? this.configuredPlayerDomain
      } finally {
        clearTimeout(timeout)
        this.playerDomainRequest = null
      }
    })()

    return this.playerDomainRequest
  }

  // ── Транспорт ──────────────────────────────────────────────

  private async get<T>(path: string): Promise<T | null> {
    return this.request<T>(path, { method: 'GET' })
  }

  private async post<T>(path: string, body: unknown, baseUrl = this.baseUrl): Promise<T | null> {
    return this.request<T>(path, { method: 'POST', body }, baseUrl)
  }

  private async request<T>(
    path: string,
    init: { method: 'GET' | 'POST'; body?: unknown },
    baseUrl = this.baseUrl,
  ): Promise<T | null> {
    if (!this.enabled) return null

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), config.players.timeoutMs)

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: init.method,
        headers: {
          Accept: 'application/json',
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
          Authorization: `Bearer ${this.token}`,
        },
        body: init.body ? JSON.stringify(init.body) : undefined,
        signal: controller.signal,
      })

      if (response.status === 404) return null
      if (!response.ok) return null

      return (await response.json()) as T
    } catch {
      return null
    } finally {
      clearTimeout(timeout)
    }
  }
}
