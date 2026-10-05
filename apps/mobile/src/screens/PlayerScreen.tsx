/**
 * PlayerScreen — полноэкранный плеер мобильного приложения.
 *
 * Возможности:
 *  - кастомные контролы поверх видео, автоскрытие через 3 секунды;
 *  - жесты: влево/вправо — перемотка 10 сек, вверх — следующая серия, вниз — выход;
 *  - анимированные табы переключения источников Vibix / Veoveo снизу;
 *  - прогресс-бар с градиентом flux → prism и пульсирующей точкой;
 *  - Picture-in-Picture и AirPlay/Chromecast средствами системы.
 */
import React from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { Video, ResizeMode, type AVPlaybackStatus } from 'expo-av'
import type { EpisodeDTO, PlayerSource, TitleDTO } from '@kinoox/api-client'
import { colors, layout } from '../lib/config'
import { usePlayerService } from '../services/PlayerService'
import { styles as baseStyles } from '../screens/screens'

const CONTROLS_IDLE_MS = 3000
const BALANCER_LABELS: Record<string, string> = { vibix: 'Vibix', veoveo: 'VeoVeo' }

export interface PlayerScreenProps {
  title: TitleDTO
  sources: PlayerSource[]
  episodes: EpisodeDTO[]
  onClose(): void
}

export function PlayerScreen({ title, sources, episodes, onClose }: PlayerScreenProps) {
  const [sourceIndex, setSourceIndex] = React.useState(0)
  const [episodeIndex, setEpisodeIndex] = React.useState(0)
  const [controlsVisible, setControlsVisible] = React.useState(true)
  const [status, setStatus] = React.useState<AVPlaybackStatus | null>(null)
  const [loading, setLoading] = React.useState(true)

  const videoRef = React.useRef<Video>(null)
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const source = sources[sourceIndex]
  const sortedEpisodes = React.useMemo(
    () => [...episodes].sort((a, b) => a.season - b.season || a.episode - b.episode),
    [episodes],
  )
  const currentEpisode = sortedEpisodes[episodeIndex]

  const playerService = usePlayerService({
    titleId: title.id,
    season: currentEpisode?.season ?? 1,
    episode: currentEpisode?.episode ?? 1,
    totalEpisodes: sortedEpisodes.length,
    onSeek: (delta) => {
      const current = status?.isLoaded ? (status.positionMillis ?? 0) / 1000 : 0
      const target = Math.max(0, current + delta)
      void videoRef.current?.setPositionAsync(target * 1000)
    },
    onNextEpisode: () => {
      if (episodeIndex < sortedEpisodes.length - 1) setEpisodeIndex((index) => index + 1)
    },
    onClose,
  })

  // Записываем прогресс при старте просмотра
  React.useEffect(() => {
    void playerService.trackProgress()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodeIndex, sourceIndex])

  // Автоскрытие контролов через 3 секунды
  const scheduleHide = React.useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setControlsVisible(false), CONTROLS_IDLE_MS)
  }, [])

  React.useEffect(() => {
    scheduleHide()
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [scheduleHide, controlsVisible])

  // Пульсирующая точка прогресс-бара
  const pulse = useSharedValue(1)
  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.35, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1,
      false,
    )
  }, [pulse])
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }))

  const position = status?.isLoaded && status.positionMillis ? status.positionMillis : 0
  const duration = status?.isLoaded && status.durationMillis ? status.durationMillis : 1
  const progress = Math.min(1, position / duration)

  return (
    <View style={styles.container}>
      <GestureDetector gesture={playerService.panGesture}>
        <View style={styles.videoWrap}>
          {source ? (
            <Video
              ref={videoRef}
              source={{ uri: source.iframeUrl }}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              useNativeControls={false}
              progressUpdateIntervalMillis={500}
              onPlaybackStatusUpdate={(next) => {
                setStatus(next)
                if (next.isLoaded) setLoading(false)
              }}
              onLoad={() => setLoading(false)}
            />
          ) : (
            <View style={styles.centeredFallback}>
              <Text style={styles.fallbackTitle}>Источник недоступен</Text>
              <Text style={styles.fallbackText}>
                Ни один балансер не отдал ссылку. Попробуйте другой источник ниже.
              </Text>
            </View>
          )}

          {loading && source ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color={colors.fluxFrom} size="large" />
            </View>
          ) : null}

          {/* Зона показа контролов */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              setControlsVisible(true)
              scheduleHide()
            }}
          />
        </View>
      </GestureDetector>

      {controlsVisible ? (
        <>
          {/* Верхняя панель */}
          <View style={styles.topBar}>
            <Pressable onPress={onClose} style={styles.closeButton} accessibilityLabel="Выход">
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
            <View style={styles.topInfo}>
              <Text style={styles.title} numberOfLines={1}>
                {title.title}
              </Text>
              <Text style={styles.subtitle}>
                {source ? BALANCER_LABELS[source.balancer] ?? source.balancer : 'Нет источника'}
                {currentEpisode ? ` · С${currentEpisode.season}E${currentEpisode.episode}` : ''}
              </Text>
            </View>
          </View>

          {/* Прогресс-бар с градиентом flux → prism и пульсирующей точкой */}
          <View style={styles.progressWrap}>
            <LinearGradient
              colors={[colors.fluxFrom, colors.prismFrom]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
            <Animated.View style={[styles.progressDot, { left: `${progress * 100}%` }, pulseStyle]} />
          </View>

          {/* Нижняя панель: источники и серии */}
          <View style={styles.bottomPanel}>
            {sources.length > 1 ? (
              <>
                <Text style={styles.panelLabel}>Источник</Text>
                <View style={styles.sourceTabs}>
                  {sources.map((item, index) => (
                    <Pressable
                      key={`${item.balancer}-${index}`}
                      onPress={() => {
                        setSourceIndex(index)
                        setLoading(true)
                      }}
                      style={[styles.sourceTab, index === sourceIndex && styles.sourceTabActive]}
                      accessibilityRole="tab"
                    >
                      <Text style={styles.sourceTabText}>
                        {BALANCER_LABELS[item.balancer] ?? item.balancer}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}

            {sortedEpisodes.length > 0 ? (
              <>
                <Text style={styles.panelLabel}>Серии</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.episodesRow}
                >
                  {sortedEpisodes.map((episode, index) => (
                    <Pressable
                      key={episode.id}
                      onPress={() => {
                        setEpisodeIndex(index)
                        setLoading(true)
                      }}
                      style={[
                        styles.episodeButton,
                        index === episodeIndex && styles.episodeButtonActive,
                      ]}
                      accessibilityRole="button"
                    >
                      <Text style={styles.episodeText}>{episode.episode}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            ) : null}

            <View style={styles.gestureHint}>
              <Text style={styles.gestureText}>↔ 10 сек · ↑ следующая серия · ↓ выход</Text>
            </View>
          </View>
        </>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.void },
  videoWrap: { flex: 1, backgroundColor: '#000' },
  video: { flex: 1 },
  centeredFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  fallbackTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '600' },
  fallbackText: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    paddingTop: 44,
    backgroundColor: 'rgba(6,7,10,0.55)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.frost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: colors.textPrimary, fontSize: 18 },
  topInfo: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  subtitle: { marginTop: 2, color: colors.textMuted, fontSize: 11 },

  progressWrap: {
    position: 'absolute',
    bottom: 168,
    left: 16,
    right: 16,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(245,247,250,0.18)',
  },
  progressFill: { height: 4, borderRadius: 2 },
  progressDot: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    marginLeft: -6,
    borderRadius: 6,
    backgroundColor: colors.fluxFrom,
    shadowColor: colors.fluxFrom,
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },

  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 28,
    backgroundColor: 'rgba(12,14,20,0.86)',
    borderTopWidth: 1,
    borderTopColor: colors.frost,
  },
  panelLabel: {
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sourceTabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  sourceTab: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.frost,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sourceTabActive: { borderColor: colors.fluxFrom, backgroundColor: 'rgba(255,61,110,0.12)' },
  sourceTabText: { color: colors.textPrimary, fontSize: 13, fontWeight: '500' },

  episodesRow: { gap: 8, paddingBottom: 12 },
  episodeButton: {
    minWidth: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.frost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  episodeButtonActive: { backgroundColor: colors.fluxFrom, borderColor: colors.fluxFrom },
  episodeText: { color: colors.textPrimary, fontSize: 12, fontWeight: '600' },

  gestureHint: { alignItems: 'center', marginTop: 4 },
  gestureText: { color: colors.textMuted, fontSize: 10, letterSpacing: 0.6 },
})

export { baseStyles }
