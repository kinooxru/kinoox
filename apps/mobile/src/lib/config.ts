/**
 * Конфигурация мобильного приложения.
 * Значения приходят из app.json → extra, с запасным вариантом для разработки.
 */
import Constants from 'expo-constants'

interface Extra {
  apiUrl?: string
  socketUrl?: string
}

const extra = (Constants.expoConfig?.extra ?? {}) as Extra

export const mobileConfig = {
  apiUrl: extra.apiUrl ?? 'http://10.0.2.2:3001/api/v1',
  socketUrl: extra.socketUrl ?? 'http://10.0.2.2:3001',
  appVersion: Constants.expoConfig?.version ?? '1.0.0',
  /** Ключи хранилища */
  storageKeys: {
    accessToken: 'kinoox.accessToken',
    refreshToken: 'kinoox.refreshToken',
    offlineTitles: 'kinoox.offline.titles',
    settings: 'kinoox.settings',
  },
} as const

/** Тёмная тема приложения — значения совпадают с дизайн-системой */
export const colors = {
  void: '#06070A',
  abyss: '#0C0E14',
  surface: '#131620',
  frost: '#1C2030',
  fluxFrom: '#FF3D6E',
  fluxTo: '#FF6B3D',
  prismFrom: '#7C5CFF',
  prismTo: '#5C8CFF',
  auraFrom: '#00E5C7',
  auraTo: '#00B8E5',
  textPrimary: '#F5F7FA',
  textSecondary: '#8B92A8',
  textMuted: '#4A5068',
  success: '#00E5C7',
  danger: '#FF453A',
} as const

/** Радиусы и отступы */
export const layout = {
  radiusCard: 20,
  radiusPanel: 28,
  radiusControl: 12,
  gutter: 16,
  screenPadding: 20,
} as const
