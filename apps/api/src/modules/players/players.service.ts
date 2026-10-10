/**
 * Оркестратор балансеров.
 *
 * Перебирает источники по приоритету: первый, который вернул результат,
 * становится `primary`. Остальные сохраняются как альтернативы —
 * пользователь переключает их анимированными табами в плеере.
 */
import type { BalancerName, PlayerSource, SeasonInfo } from '@kinoox/api-client'
import { config } from '../../config'
import { cacheKeys, type CacheService } from '../../core/plugins/cache.plugin'
import { MockBalancerService } from './mock/mock.service'
import { VibixService } from './vibix/vibix.service'
import { VeoveoService } from './veoveo/veoveo.service'
import type { BalancerPlayerOptions, IBalancerService } from './players.types'

export interface TitleSources {
  sources: PlayerSource[]
  primary: PlayerSource | null
}

export class PlayersOrchestrator {
  private readonly services: IBalancerService[]
  private readonly cache: CacheService | null

  constructor(cache: CacheService | null = null, services?: IBalancerService[]) {
    this.cache = cache
    this.services = (services ?? PlayersOrchestrator.createDefaultServices()).sort(
      (a, b) => a.priority - b.priority,
    )
  }

  /** Собирает список сервисов согласно PLAYERS_MODE */
  static createDefaultServices(): IBalancerService[] {
    if (config.players.mode === 'mock') {
      return [
        new MockBalancerService('vibix', config.players.vibix.priority),
        new MockBalancerService('veoveo', config.players.veoveo.priority),
      ]
    }

    return [new VibixService(), new VeoveoService()]
  }

  get balancers(): Array<{ name: BalancerName; priority: number; enabled: boolean }> {
    return this.services.map((service) => ({
      name: service.name,
      priority: service.priority,
      enabled: service.enabled,
    }))
  }

  /**
   * Все доступные источники для тайтла.
   * Порядок — по приоритету балансеров.
   */
  async getSources(
    params: { kpId?: number | null; imdbId?: string | null; balancerId?: string | null },
    options?: BalancerPlayerOptions,
  ): Promise<TitleSources> {
    const cacheKey = this.buildCacheKey(params, options)
    if (this.cache) {
      const cached = await this.cache.get<TitleSources>(cacheKey)
      if (cached) return cached
    }

    const sources = await Promise.all(
      this.services
        .filter((service) => service.enabled)
        .map((service) => this.fetchFrom(service, params, options)),
    )

    const available = sources.filter((source): source is PlayerSource => source !== null)
    const result: TitleSources = {
      sources: available,
      primary: available[0] ?? null,
    }

    if (this.cache && available.length > 0) {
      await this.cache.set(cacheKey, result, config.players.cacheTtl)
    }

    return result
  }

  /** Только приоритетный источник */
  async getPrimarySource(
    params: { kpId?: number | null; imdbId?: string | null },
    options?: BalancerPlayerOptions,
  ): Promise<PlayerSource | null> {
    const { primary } = await this.getSources(params, options)
    return primary
  }

  /** Источник конкретного балансера */
  async getSourceByBalancer(
    balancer: BalancerName,
    params: { kpId?: number | null; imdbId?: string | null; balancerId?: string | null },
    options?: BalancerPlayerOptions,
  ): Promise<PlayerSource | null> {
    const service = this.services.find((item) => item.name === balancer && item.enabled)
    if (!service) return null
    return this.fetchFrom(service, params, options)
  }

  /** Сезоны и серии из первого балансера, который их отдал */
  async getEpisodes(kpId: number): Promise<SeasonInfo[]> {
    for (const service of this.services) {
      if (!service.enabled) continue
      const episodes = await service.getEpisodes(kpId)
      if (episodes.length > 0) return episodes
    }
    return []
  }

  /** Очистить кэш источников конкретного тайтла */
  async invalidate(titleId: number): Promise<void> {
    await this.cache?.del(cacheKeys.titleSources(titleId))
  }

  private async fetchFrom(
    service: IBalancerService,
    params: { kpId?: number | null; imdbId?: string | null; balancerId?: string | null },
    options?: BalancerPlayerOptions,
  ): Promise<PlayerSource | null> {
    try {
      if (params.kpId) return await service.getPlayerByKpId(params.kpId, options)
      if (params.imdbId) return await service.getPlayerByImdbId(params.imdbId, options)
      if (params.balancerId) return await service.getPlayerById(params.balancerId, options)
      return null
    } catch {
      // Ошибка одного балансера не должна ломать выдачу остальных
      return null
    }
  }

  private buildCacheKey(
    params: { kpId?: number | null; imdbId?: string | null; balancerId?: string | null },
    options?: BalancerPlayerOptions,
  ): string {
    const id = params.kpId ? `kp${params.kpId}` : params.imdbId ? `imdb${params.imdbId}` : `id${params.balancerId}`
    const suffix = [
      options?.trailer ? 'trailer' : '',
      options?.trailerOnly ? 'traileronly' : '',
      options?.season ? `s${options.season}` : '',
      options?.episode ? `e${options.episode}` : '',
    ]
      .filter(Boolean)
      .join('-')
    return `${cacheKeys.titleSources(0).replace(':0:', ':')}:${id}${suffix ? `:${suffix}` : ''}`
  }
}
