/**
 * Описания платформ на стороне сайта.
 *
 * Тексты дублируют серверный реестр и используются как резерв,
 * когда API недоступен: страница /download остаётся полностью рабочей.
 */
import type { AppPlatform } from '@kinoox/api-client'

export interface SitePlatformDescriptor {
  platform: AppPlatform
  title: string
  description: string
  size: string
  minimumOs: string
  features: string[]
  formats: Array<{ label: string; format: string; extension: string }>
  hasQr: boolean
  screenshots: string[]
}

export const PLATFORM_MAP: Record<AppPlatform, SitePlatformDescriptor> = {
  android: {
    platform: 'android',
    title: 'Android',
    description:
      'Полноценное нативное приложение KINOOX для Android. Каталог, плеер, закладки, офлайн-кэш, push-уведомления о новых сериях.',
    size: '~25 МБ',
    minimumOs: 'Android 8.0+',
    features: ['Material You', 'Picture-in-Picture', 'Chromecast', 'push-уведомления', 'офлайн-каталог'],
    formats: [{ label: 'Скачать APK', format: 'apk', extension: 'apk' }],
    hasQr: true,
    screenshots: [
      '/screenshots/android/01-home.svg',
      '/screenshots/android/02-title.svg',
      '/screenshots/android/03-player.svg',
      '/screenshots/android/04-bookmarks.svg',
      '/screenshots/android/05-downloads.svg',
    ],
  },
  ios: {
    platform: 'ios',
    title: 'iOS',
    description:
      'KINOOX для iOS — нативное приложение для iPhone и iPad. Жесты, AirPlay, сплит-скрин на iPad.',
    size: '~30 МБ',
    minimumOs: 'iOS 14.0+',
    features: ['AirPlay', 'Picture-in-Picture', 'Force Touch', 'push-уведомления', 'сплит-скрин'],
    formats: [{ label: 'Установить через TestFlight', format: 'testflight', extension: 'ipa' }],
    hasQr: true,
    screenshots: [
      '/screenshots/ios/01-home.svg',
      '/screenshots/ios/02-title.svg',
      '/screenshots/ios/03-player.svg',
      '/screenshots/ios/04-split-view.svg',
      '/screenshots/ios/05-profile.svg',
    ],
  },
  windows: {
    platform: 'windows',
    title: 'Windows',
    description:
      'KINOOX для Windows — лёгкий нативный клиент с мини-плеером, горячими клавишами и системным треем.',
    size: '~8 МБ',
    minimumOs: 'Windows 10/11',
    features: ['мини-плеер поверх окон', 'системный трей', 'горячие клавиши', 'нативные уведомления'],
    formats: [
      { label: 'Скачать .exe', format: 'exe', extension: 'exe' },
      { label: 'Скачать .msi', format: 'msi', extension: 'msi' },
    ],
    hasQr: false,
    screenshots: [
      '/screenshots/windows/01-home.svg',
      '/screenshots/windows/02-player.svg',
      '/screenshots/windows/03-mini-player.svg',
      '/screenshots/windows/04-tray.svg',
    ],
  },
  macos: {
    platform: 'macos',
    title: 'macOS',
    description: 'KINOOX для macOS — нативный клиент с Touch Bar и Picture-in-Picture.',
    size: '~7 МБ',
    minimumOs: 'macOS 11+',
    features: ['Touch Bar', 'Picture-in-Picture', 'автозапуск', 'нативные уведомления'],
    formats: [{ label: 'Скачать .dmg', format: 'dmg', extension: 'dmg' }],
    hasQr: false,
    screenshots: [
      '/screenshots/macos/01-home.svg',
      '/screenshots/macos/02-player.svg',
      '/screenshots/macos/03-touchbar.svg',
    ],
  },
  linux: {
    platform: 'linux',
    title: 'Linux',
    description: 'KINOOX для Linux — AppImage, .deb и .rpm для всех дистрибутивов.',
    size: '~8 МБ',
    minimumOs: 'Ubuntu 20.04+, Fedora 35+',
    features: ['AppImage без установки', 'нативные уведомления', 'трей'],
    formats: [
      { label: 'Скачать .AppImage', format: 'AppImage', extension: 'AppImage' },
      { label: 'Скачать .deb', format: 'deb', extension: 'deb' },
      { label: 'Скачать .rpm', format: 'rpm', extension: 'rpm' },
    ],
    hasQr: false,
    screenshots: [
      '/screenshots/linux/01-home.svg',
      '/screenshots/linux/02-player.svg',
      '/screenshots/linux/03-tray.svg',
    ],
  },
}