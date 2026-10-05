/**
 * Описания платформ для страницы /download.
 *
 * Тексты совпадают с заданием: описания, особенности, форматы файлов
 * и системные требования каждой платформы.
 */
import type { PlatformDescriptor } from './downloads.types'

export const PLATFORMS: PlatformDescriptor[] = [
  {
    platform: 'android',
    title: 'Android',
    description:
      'Полноценное нативное приложение KINOOX для Android. Каталог, плеер, закладки, офлайн-кэш, push-уведомления о новых сериях.',
    minimumOs: 'Android 8.0+',
    features: [
      'Material You',
      'Picture-in-Picture',
      'Chromecast',
      'push-уведомления',
      'офлайн-каталог',
    ],
    formats: [{ label: 'Скачать APK', format: 'apk', kind: 'installer' }],
    hasQr: true,
    screenshots: [
      '/screenshots/android/01-home.svg',
      '/screenshots/android/02-title.svg',
      '/screenshots/android/03-player.svg',
      '/screenshots/android/04-bookmarks.svg',
      '/screenshots/android/05-downloads.svg',
    ],
  },
  {
    platform: 'ios',
    title: 'iOS',
    description:
      'KINOOX для iOS — нативное приложение для iPhone и iPad. Жесты, AirPlay, сплит-скрин на iPad.',
    minimumOs: 'iOS 14.0+',
    features: ['AirPlay', 'Picture-in-Picture', 'Force Touch', 'push-уведомления', 'сплит-скрин'],
    formats: [{ label: 'Установить через TestFlight', format: 'testflight', kind: 'store' }],
    hasQr: true,
    screenshots: [
      '/screenshots/ios/01-home.svg',
      '/screenshots/ios/02-title.svg',
      '/screenshots/ios/03-player.svg',
      '/screenshots/ios/04-split-view.svg',
      '/screenshots/ios/05-profile.svg',
    ],
  },
  {
    platform: 'windows',
    title: 'Windows',
    description:
      'KINOOX для Windows — лёгкий нативный клиент с мини-плеером, горячими клавишами и системным треем.',
    minimumOs: 'Windows 10/11',
    features: [
      'мини-плеер поверх окон',
      'системный трей',
      'горячие клавиши',
      'нативные уведомления',
    ],
    formats: [
      { label: 'Скачать .exe', format: 'exe', kind: 'installer' },
      { label: 'Скачать .msi', format: 'msi', kind: 'portable' },
    ],
    hasQr: false,
    screenshots: [
      '/screenshots/windows/01-home.svg',
      '/screenshots/windows/02-player.svg',
      '/screenshots/windows/03-mini-player.svg',
      '/screenshots/windows/04-tray.svg',
    ],
  },
  {
    platform: 'macos',
    title: 'macOS',
    description: 'KINOOX для macOS — нативный клиент с Touch Bar и Picture-in-Picture.',
    minimumOs: 'macOS 11+',
    features: ['Touch Bar', 'Picture-in-Picture', 'автозапуск', 'нативные уведомления'],
    formats: [{ label: 'Скачать .dmg', format: 'dmg', kind: 'installer' }],
    hasQr: false,
    screenshots: [
      '/screenshots/macos/01-home.svg',
      '/screenshots/macos/02-player.svg',
      '/screenshots/macos/03-touchbar.svg',
    ],
  },
  {
    platform: 'linux',
    title: 'Linux',
    description: 'KINOOX для Linux — AppImage, .deb и .rpm для всех дистрибутивов.',
    minimumOs: 'Ubuntu 20.04+, Fedora 35+',
    features: ['AppImage без установки', 'нативные уведомления', 'трей'],
    formats: [
      { label: 'Скачать .AppImage', format: 'AppImage', kind: 'portable' },
      { label: 'Скачать .deb', format: 'deb', kind: 'installer' },
      { label: 'Скачать .rpm', format: 'rpm', kind: 'installer' },
    ],
    hasQr: false,
    screenshots: [
      '/screenshots/linux/01-home.svg',
      '/screenshots/linux/02-player.svg',
      '/screenshots/linux/03-tray.svg',
    ],
  },
]

export const PLATFORM_MAP: Record<string, PlatformDescriptor> = Object.fromEntries(
  PLATFORMS.map((descriptor) => [descriptor.platform, descriptor]),
)

/** Публичный базовый путь к файлам сборок */
export const DOWNLOADS_BASE_PATH = '/downloads'
