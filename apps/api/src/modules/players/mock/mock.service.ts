/**
 * Mock-балансер.
 *
 * Используется при PLAYERS_MODE=mock: разработка и тесты идут без
 * обращения к внешним API балансеров. Формат ответа полностью совпадает
 * с реальными сервисами.
 */
import type { BalancerName, PlayerSource, SeasonInfo } from '@kinoox/api-client'
import type { BalancerPlayerOptions, BalancerTitleInfo, IBalancerService } from '../players.types.js'

export class MockBalancerService implements IBalancerService {
  readonly name: BalancerName
  readonly priority: number
  readonly enabled = true

  constructor(name: BalancerName, priority: number) {
    this.name = name
    this.priority = priority
  }

  async getPlayerByKpId(kpId: number, options?: BalancerPlayerOptions): Promise<PlayerSource | null> {
    return this.buildSource(kpId, options)
  }

  async getPlayerByImdbId(
    imdbId: string,
    options?: BalancerPlayerOptions,
  ): Promise<PlayerSource | null> {
    // Детерминированно превращаем IMDB ID в число, чтобы mock был стабилен
    const numeric = Number(imdbId.replace(/\D/g, '')) || 1
    return this.buildSource(numeric, options)
  }

  async getPlayerById(id: string, options?: BalancerPlayerOptions): Promise<PlayerSource | null> {
    const numeric = Number(id) || 1
    return this.buildSource(numeric, options)
  }

  async getEpisodes(kpId: number): Promise<SeasonInfo[]> {
    const seasonsCount = (kpId % 3) + 1
    return Array.from({ length: seasonsCount }, (_, seasonIndex) => {
      const episodesCount = ((kpId + seasonIndex) % 8) + 4
      return {
        name: `Сезон ${seasonIndex + 1}`,
        series: Array.from({ length: episodesCount }, (_, episodeIndex) => ({
          id: seasonIndex * 100 + episodeIndex + 1,
          name: `Серия ${episodeIndex + 1}`,
        })),
      }
    })
  }

  async getTitleInfo(kpId: number): Promise<BalancerTitleInfo> {
    return {
      balancerId: `mock-${this.name}-${kpId}`,
      kpId,
      imdbId: null,
      name: `Демонстрационный тайтл ${kpId}`,
      nameRus: `Демонстрационный тайтл ${kpId}`,
      nameEng: `Demo title ${kpId}`,
      nameOriginal: `Demo title ${kpId}`,
      type: kpId % 4 === 0 ? 'serial' : 'movie',
      year: 2000 + (kpId % 25),
      posterUrl: `https://picsum.photos/seed/kinoox-${kpId}/400/600`,
      backdropUrl: `https://picsum.photos/seed/kinoox-${kpId}-wide/1600/900`,
      duration: 90 + (kpId % 60),
      quality: '1080p',
      kpRating: Number((5 + (kpId % 45) / 10).toFixed(1)),
      imdbRating: Number((5 + (kpId % 40) / 10).toFixed(1)),
      genres: ['драма', 'комедия', 'боевик'].filter((_, index) => (kpId + index) % 2 === 0),
      countries: ['Россия', 'США'].filter((_, index) => (kpId + index) % 2 === 0),
      description: `Демонстрационное описание тайтла с ID Кинопоиска ${kpId}.`,
      descriptionShort: `Демо-тайтл #${kpId}.`,
      iframeUrl: `https://player.kinoox.demo/${this.name}/kp/${kpId}`,
      embedCode: `<ins data-publisher-id="demo" data-type="kp" data-id="${kpId}"></ins>`,
      uploadedAt: new Date().toISOString(),
    }
  }

  private async buildSource(kpId: number, options?: BalancerPlayerOptions): Promise<PlayerSource> {
    const isSerial = kpId % 4 === 0
    const query = new URLSearchParams({ kp: String(kpId) })
    if (options?.season) query.set('season', String(options.season))
    if (options?.episode) query.set('episode', String(options.episode))
    if (options?.sync) query.set('sync', 'true')
    if (options?.trailerOnly) query.set('trailer', 'only')
    else if (options?.trailer) query.set('trailer', 'true')

    return {
      balancer: this.name,
      iframeUrl: `https://player.kinoox.demo/${this.name}/embed?${query.toString()}`,
      quality: '1080p',
      embedCode: `<ins data-publisher-id="demo" data-type="kp" data-id="${kpId}"></ins>`,
      episodes: isSerial ? await this.getEpisodes(kpId) : undefined,
    }
  }
}
