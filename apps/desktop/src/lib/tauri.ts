/**
 * Мост между интерфейсом и нативной частью Tauri.
 * Все вызовы Rust-команд собраны в одном месте, чтобы UI не знал деталей IPC.
 */
import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { platform } from '@tauri-apps/plugin-os'

export interface ContinueWatching {
  titleId: number
  titleName: string
  season?: number | null
  episode?: number | null
}

export interface AppSettings {
  autostart: boolean
  startMinimized: boolean
  miniPlayerOnMinimize: boolean
  notifications: boolean
}

export interface MiniPlayerState {
  active: boolean
}

/**
 * Высокоуровневый API десктопного приложения.
 * Работает только внутри Tauri; в браузере вызовы игнорируются.
 */
export const desktop = {
  /** Режим мини-плеера: окно поверх всех, компактный размер */
  toggleMiniPlayer(active: boolean): Promise<MiniPlayerState> {
    return invoke<MiniPlayerState>('toggle_mini_player', { active })
  },

  /** Запомнить тайтл для пункта трея «Продолжить просмотр» */
  setContinueWatching(item: ContinueWatching): Promise<void> {
    return invoke('set_continue_watching', { item })
  },

  /** Прочитать запись «Продолжить просмотр» */
  getContinueWatching(): Promise<ContinueWatching | null> {
    return invoke<ContinueWatching | null>('get_continue_watching')
  },

  /** Нативное уведомление ОС о новой серии */
  notifyNewEpisode(title: string, body: string): Promise<void> {
    return invoke('notify_new_episode', { title, body })
  },

  /** Автозапуск с системой */
  setAutostart(enabled: boolean): Promise<void> {
    return invoke('set_autostart', { enabled })
  },

  /** Управление окном из кастомного заголовка */
  windowControl(action: 'minimize' | 'maximize' | 'close' | 'quit'): Promise<void> {
    return invoke('window_control', { action })
  },

  /** Текущая платформа: windows, macos или linux */
  platform(): string {
    try {
      return platform()
    } catch {
      return 'unknown'
    }
  },

  /** События из трея */
  onTrayEvent(
    name: 'tray:continue' | 'tray:search' | 'tray:bookmark' | 'tray:mini-player',
    handler: (payload: unknown) => void,
  ): Promise<UnlistenFn> {
    return listen(name, (event) => handler(event.payload))
  },

  /** Изменение режима мини-плеера */
  onMiniPlayerChanged(handler: (state: MiniPlayerState) => void): Promise<UnlistenFn> {
    return listen<MiniPlayerState>('mini-player-changed', (event) => handler(event.payload))
  },

  /** Заголовок окна: перетаскивание и системные кнопки */
  currentWindow: getCurrentWindow,
}
