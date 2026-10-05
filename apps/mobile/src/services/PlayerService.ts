/**
 * PlayerService — управление плеером и жестами.
 *
 * Жесты:
 *  - свайп влево/вправо — перемотка на 10 секунд;
 *  - свайп вверх — следующая серия;
 *  - свайп вниз — выход из плеера.
 */
import { useCallback, useRef } from 'react'
import { Dimensions } from 'react-native'
import { Gesture } from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-reanimated'
import * as ScreenOrientation from 'expo-screen-orientation'
import { api } from '../lib/api'

const SEEK_STEP_SECONDS = 10
const SWIPE_THRESHOLD = 60

export interface PlayerServiceOptions {
  titleId: number
  /** Текущий сезон и серия — для перехода к следующей */
  season: number
  episode: number
  totalEpisodes: number
  onSeek(deltaSeconds: number): void
  onNextEpisode(): void
  onClose(): void
}

export interface PlayerServiceResult {
  /** Жестовый детектор: подключить к контейнеру плеера */
  panGesture: ReturnType<typeof Gesture.Pan>
  /** Перевести экран в горизонтальную ориентацию */
  enterFullscreen(): Promise<void>
  /** Вернуть портретную ориентацию */
  exitFullscreen(): Promise<void>
  /** Записать факт просмотра на сервере */
  trackProgress(): Promise<void>
}

export function usePlayerService(options: PlayerServiceOptions): PlayerServiceResult {
  const optionsRef = useRef(options)
  optionsRef.current = options

  const { width } = Dimensions.get('window')

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .activeOffsetY([-20, 20])
    .onEnd((event) => {
      const { translationX, translationY } = event

      // Горизонтальный свайп — перемотка
      if (Math.abs(translationX) > Math.abs(translationY)) {
        if (Math.abs(translationX) < SWIPE_THRESHOLD) return
        const direction = translationX > 0 ? 1 : -1
        const multiplier = Math.min(3, Math.ceil(Math.abs(translationX) / (width / 3)))
        runOnJS(optionsRef.current.onSeek)(direction * SEEK_STEP_SECONDS * multiplier)
        return
      }

      // Вертикальный свайп
      if (Math.abs(translationY) < SWIPE_THRESHOLD) return
      if (translationY < 0) {
        // Вверх — следующая серия
        const { episode, totalEpisodes } = optionsRef.current
        if (episode < totalEpisodes) runOnJS(optionsRef.current.onNextEpisode)()
      } else {
        // Вниз — выход из плеера
        runOnJS(optionsRef.current.onClose)()
      }
    })

  const enterFullscreen = useCallback(async () => {
    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE)
    } catch {
      // Ориентация может быть заблокирована настройками устройства
    }
  }, [])

  const exitFullscreen = useCallback(async () => {
    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
    } catch {
      // Игнорируем
    }
  }, [])

  const trackProgress = useCallback(async () => {
    const { titleId, season, episode } = optionsRef.current
    try {
      await api.user.addHistory({ titleId, season, episode })
    } catch {
      // Прогресс не критичен для воспроизведения
    }
  }, [])

  return { panGesture, enterFullscreen, exitFullscreen, trackProgress }
}
