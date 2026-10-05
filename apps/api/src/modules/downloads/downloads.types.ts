/**
 * Типы модуля дистрибуции приложений.
 */
import type { AppPlatform, ChangelogEntry, DownloadPlatformDTO } from '@kinoox/api-client'

export interface PlatformDescriptor {
  platform: AppPlatform
  title: string
  description: string
  minimumOs: string
  features: string[]
  /** Кнопки скачивания: подпись, формат */
  formats: Array<{ label: string; format: string; kind: 'installer' | 'portable' | 'store' }>
  /** Мобильные платформы показывают QR-код */
  hasQr: boolean
  /** Ключ набора скриншотов */
  screenshots: string[]
}

export interface PlatformVersionRecord {
  platform: AppPlatform
  version: string
  url: string
  size: string
  minimumOs: string
  changelog: string[]
  releaseDate: string
}

export type { ChangelogEntry, DownloadPlatformDTO }
