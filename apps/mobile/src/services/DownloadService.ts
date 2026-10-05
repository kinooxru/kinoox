/**
 * DownloadService — офлайн-каталог.
 *
 * Кэширует описания тайтлов, постеры и последние серии в AsyncStorage,
 * чтобы каталог открывался без интернета.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as FileSystem from 'expo-file-system'
import NetInfo from '@react-native-community/netinfo'
import type { EpisodeDTO, TitleCardDTO, TitleDTO } from '@kinoox/api-client'
import { api } from '../lib/api'
import { mobileConfig } from '../lib/config'

interface OfflineBundle {
  savedAt: string
  titles: TitleCardDTO[]
}

interface OfflineTitleDetail {
  savedAt: string
  title: TitleDTO
  episodes: EpisodeDTO[]
  posterPath: string | null
}

const DIRECTORY = `${FileSystem.documentDirectory}kinoox-posters/`

export class DownloadService {
  /** Скачать постер в локальное хранилище и вернуть путь к файлу */
  private async cachePoster(posterUrl: string, titleId: number): Promise<string | null> {
    try {
      const info = await FileSystem.getInfoAsync(DIRECTORY)
      if (!info.exists) await FileSystem.makeDirectoryAsync(DIRECTORY, { intermediates: true })

      const target = `${DIRECTORY}${titleId}.jpg`
      const existing = await FileSystem.getInfoAsync(target)
      if (existing.exists) return target

      const result = await FileSystem.downloadAsync(posterUrl, target)
      return result.status === 200 ? target : null
    } catch {
      return null
    }
  }

  /** Сохранить тайтл с сериями и постером для офлайн-доступа */
  async saveTitle(titleId: number): Promise<boolean> {
    try {
      const [title, episodes] = await Promise.all([
        api.titles.byId(titleId),
        api.titles.episodes(titleId).catch(() => []),
      ])

      const posterPath = title.posterUrl ? await this.cachePoster(title.posterUrl, titleId) : null

      const bundle: OfflineTitleDetail = {
        savedAt: new Date().toISOString(),
        title,
        episodes,
        posterPath,
      }

      await AsyncStorage.setItem(
        `${mobileConfig.storageKeys.offlineTitles}.${titleId}`,
        JSON.stringify(bundle),
      )

      // Добавляем тайтл в офлайн-каталог
      const catalog = await this.getOfflineTitles()
      const card = this.toCard(title)
      const next = [card, ...catalog.filter((item) => item.id !== titleId)]
      await AsyncStorage.setItem(mobileConfig.storageKeys.offlineTitles, JSON.stringify(next))

      return true
    } catch {
      return false
    }
  }

  /** Удалить тайтл из офлайн-хранилища */
  async removeTitle(titleId: number): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${mobileConfig.storageKeys.offlineTitles}.${titleId}`)
      const catalog = await this.getOfflineTitles()
      await AsyncStorage.setItem(
        mobileConfig.storageKeys.offlineTitles,
        JSON.stringify(catalog.filter((item) => item.id !== titleId)),
      )
      await FileSystem.deleteAsync(`${DIRECTORY}${titleId}.jpg`, { idempotent: true })
    } catch {
      // Игнорируем: запись могла отсутствовать
    }
  }

  /** Список тайтлов, доступных без интернета */
  async getOfflineTitles(): Promise<TitleCardDTO[]> {
    try {
      const raw = await AsyncStorage.getItem(mobileConfig.storageKeys.offlineTitles)
      if (!raw) return []
      const parsed = JSON.parse(raw) as OfflineBundle['titles']
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  /** Детали сохранённого тайтла */
  async getOfflineTitle(titleId: number): Promise<OfflineTitleDetail | null> {
    try {
      const raw = await AsyncStorage.getItem(`${mobileConfig.storageKeys.offlineTitles}.${titleId}`)
      if (!raw) return null
      return JSON.parse(raw) as OfflineTitleDetail
    } catch {
      return null
    }
  }

  /** Есть ли интернет прямо сейчас */
  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch()
    return Boolean(state.isConnected)
  }

  /** Кэшировать каталог целиком — для офлайн-режима списка */
  async cacheCatalog(): Promise<number> {
    const online = await this.isOnline()
    if (!online) return 0

    try {
      const result = await api.titles.list({ sort: 'popular', page: 1, perPage: 60 })
      await AsyncStorage.setItem(
        mobileConfig.storageKeys.offlineTitles,
        JSON.stringify(result.items),
      )
      return result.items.length
    } catch {
      return 0
    }
  }

  private toCard(title: TitleDTO): TitleCardDTO {
    return {
      id: title.id,
      type: title.type,
      title: title.title,
      originalTitle: title.originalTitle,
      posterUrl: title.posterUrl,
      year: title.year,
      ratingKp: title.ratingKp,
      genres: title.genres,
      status: title.status,
    }
  }
}

export const downloadService = new DownloadService()
