'use client'

import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { EpisodeDTO, PlayerSource, SeasonInfo } from '@kinoox/api-client'
import { Button, Tabs } from '@kinoox/design-system'
import { useAuth } from '@/components/providers/AuthProvider'

export interface PlayerProps {
  titleId: number
  titleName: string
  /** Источники по приоритету: сначала Vibix, затем VeoVeo */
  sources: PlayerSource[]
  /** Серии из БД — для списка серий, когда балансер не отдал своё дерево */
  episodes: EpisodeDTO[]
  /** Открыт ли плеер */
  open: boolean
  onClose(): void
}

const BALANCER_LABELS: Record<string, string> = {
  vibix: 'Vibix',
  veoveo: 'VeoVeo',
}

/** Собирает плоский список серий по сезонам из данных балансера */
function groupSeasons(source: PlayerSource | null, episodes: EpisodeDTO[]): SeasonInfo[] {
  if (source?.episodes && source.episodes.length > 0) return source.episodes

  const bySeason = new Map<number, SeasonInfo>()
  for (const episode of episodes) {
    const season = bySeason.get(episode.season) ?? {
      name: `Сезон ${episode.season}`,
      series: [],
    }
    season.series.push({ id: episode.id, name: episode.name ?? `Серия ${episode.episode}` })
    bySeason.set(episode.season, season)
  }

  return [...bySeason.values()]
}

/**
 * Плеер KINOOX.
 *
 * Выезжает снизу с easing cubic-bezier(0.16, 1, 0.3, 1), экран затемняется.
 * Контролы — кастомные, glassmorphism: появляются при движении и исчезают
 * через 3 секунды бездействия. Переключение источников Vibix/VeoVeo —
 * анимированные табы снизу.
 */
export function Player({ titleId, titleName, sources, episodes, open, onClose }: PlayerProps) {
  const { api, isAuthenticated } = useAuth()

  const [sourceIndex, setSourceIndex] = React.useState(0)
  const [seasonIndex, setSeasonIndex] = React.useState(0)
  const [episodeIndex, setEpisodeIndex] = React.useState(0)
  const [controlsVisible, setControlsVisible] = React.useState(true)
  const [syncEnabled, setSyncEnabled] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const source = sources[sourceIndex] ?? null
  const seasons = React.useMemo(() => groupSeasons(source, episodes), [source, episodes])
  const currentSeason = seasons[seasonIndex]
  const currentEpisode = currentSeason?.series[episodeIndex]

  // Плеер выезжает снизу; при открытии записываем просмотр в историю
  React.useEffect(() => {
    if (!open) return
    setControlsVisible(true)

    if (isAuthenticated) {
      void api.user
        .addHistory({
          titleId,
          season: currentSeason ? seasonIndex + 1 : undefined,
          episode: currentEpisode ? episodeIndex + 1 : undefined,
        })
        .catch(() => undefined)
    }
    // Запись истории нужна только в момент открытия плеера
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Автоскрытие контролов через 3 секунды бездействия
  React.useEffect(() => {
    if (!open || !controlsVisible) return undefined

    const timer = setTimeout(() => setControlsVisible(false), 3000)
    return () => clearTimeout(timer)
  }, [open, controlsVisible, sourceIndex, seasonIndex, episodeIndex])

  // Esc закрывает плеер, Space показывает контролы
  React.useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      } else if (event.key === ' ') {
        event.preventDefault()
        setControlsVisible(true)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  // Формируем URL источника с учётом выбранного сезона и серии
  const iframeUrl = React.useMemo(() => {
    if (!source) return null
    const url = new URL(source.iframeUrl)
    // Добавляем сезон и серию только если в источнике действительно есть сезоны сериала
    const hasMultipleEpisodes = seasons.length > 1 || (seasons[0] && seasons[0].series.length > 1)
    if (hasMultipleEpisodes && currentSeason && currentEpisode) {
      const seasonMatch = String(currentSeason.name ?? '').match(/\d+/)
      const seasonNum = seasonMatch ? Number(seasonMatch[0]) : seasonIndex + 1
      if (seasonNum > 0) {
        url.searchParams.set('season', String(seasonNum))
        url.searchParams.set('episode', String(episodeIndex + 1))
      }
    }
    if (syncEnabled) url.searchParams.set('sync', 'true')
    return url.toString()
  }, [source, seasons, currentSeason, currentEpisode, seasonIndex, episodeIndex, syncEnabled])

  const retryOtherSource = () => {
    if (sources.length < 2) return
    setError(null)
    setSourceIndex((index) => (index + 1) % sources.length)
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[500] flex flex-col bg-[rgba(6,7,10,0.92)] backdrop-blur-[20px]"
          role="dialog"
          aria-modal="true"
          aria-label={`Плеер: ${titleName}`}
          onMouseMove={() => setControlsVisible(true)}
          onClick={() => setControlsVisible(true)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-full w-full flex-col"
          >
            {/* Верхняя панель управления */}
            <AnimatePresence>
              {controlsVisible ? (
                <motion.header
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-4 px-6 py-5"
                >
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-[var(--text-h3)] font-semibold text-text-primary">
                      {titleName}
                    </h2>
                    <p className="mt-0.5 font-mono text-[11px] text-text-muted">
                      {source ? BALANCER_LABELS[source.balancer] ?? source.balancer : 'Источник'}
                      {source?.quality ? ` · ${source.quality}` : ''}
                      {currentSeason
                        ? ` · ${
                            typeof currentSeason.name === 'number' || /^\d+$/.test(String(currentSeason.name))
                              ? `Сезон ${currentSeason.name}`
                              : currentSeason.name
                          }`
                        : ''}
                      {currentEpisode ? ` · ${currentEpisode.name}` : ''}
                    </p>
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    {sources.length > 1 ? (
                      <div className="flex items-center gap-1 rounded-full border border-frost bg-abyss/80 p-1">
                        {sources.map((item, index) => (
                          <button
                            key={item.balancer}
                            type="button"
                            onClick={() => {
                              setSourceIndex(index)
                              setError(null)
                            }}
                            className={[
                              'rounded-full px-3 py-1 font-medium text-[12px] transition-all',
                              index === sourceIndex
                                ? 'bg-gradient-flux text-void font-semibold shadow-sm'
                                : 'text-text-secondary hover:text-text-primary hover:bg-surface/50',
                            ].join(' ')}
                          >
                            {BALANCER_LABELS[item.balancer] ?? item.balancer}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <Button
                      variant={syncEnabled ? 'flux' : 'glass'}
                      size="sm"
                      onClick={() => setSyncEnabled((value) => !value)}
                      aria-pressed={syncEnabled}
                    >
                      Совместный просмотр
                    </Button>
                    <Button variant="glass" size="sm" onClick={onClose} aria-label="Закрыть плеер">
                      Esc
                    </Button>
                  </div>
                </motion.header>
              ) : null}
            </AnimatePresence>

            {/* Область видео */}
            <div className="relative flex-1 px-4 pb-4 sm:px-6">
              <div className="relative h-full w-full overflow-hidden rounded-[20px] border border-frost bg-void">
                {iframeUrl ? (
                  <iframe
                    key={iframeUrl}
                    src={iframeUrl}
                    title={`Плеер ${source?.balancer ?? ''}`}
                    allow="autoplay; fullscreen *; picture-in-picture; encrypted-media"
                    referrerPolicy="strict-origin-when-cross-origin"
                    className="h-full w-full border-0"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                    <p className="font-display text-[var(--text-h3)] font-semibold text-text-primary">
                      Источник недоступен
                    </p>
                    <p className="max-w-md text-[var(--text-small)] text-text-secondary">
                      Ни один балансер не отдал ссылку на этот тайтл. Попробуйте позже —
                      мы проверяем источники каждые 10 минут.
                    </p>
                  </div>
                )}

                {/* Всегда видимый переключатель в правом верхнем углу, если контролы скрылись */}
                {!controlsVisible && sources.length > 1 ? (
                  <div className="absolute top-4 right-4 z-40 flex items-center gap-1 rounded-full border border-frost bg-abyss/90 p-1 backdrop-blur-md shadow-lg">
                    {sources.map((item, index) => (
                      <button
                        key={item.balancer}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSourceIndex(index)
                          setError(null)
                          setControlsVisible(true)
                        }}
                        className={[
                          'rounded-full px-3 py-1 font-medium text-[12px] transition-all',
                          index === sourceIndex
                            ? 'bg-gradient-flux text-void font-semibold'
                            : 'text-text-secondary hover:text-text-primary',
                        ].join(' ')}
                      >
                        {BALANCER_LABELS[item.balancer] ?? item.balancer}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Нижняя панель: источники и серии */}
            <AnimatePresence>
              {controlsVisible ? (
                <motion.footer
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 24 }}
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  className="border-t border-frost bg-[rgba(12,14,20,0.72)] px-6 py-5 backdrop-blur-[20px]"
                >
                  {sources.length > 1 ? (
                    <div className="mb-4">
                      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                        Источник
                      </p>
                      <Tabs
                        items={sources.map((item, index) => ({
                          value: String(index),
                          label: BALANCER_LABELS[item.balancer] ?? item.balancer,
                          badge: item.quality,
                        }))}
                        value={String(sourceIndex)}
                        onChange={(value) => {
                          setSourceIndex(Number(value))
                          setError(null)
                        }}
                        variant="pill"
                        ariaLabel="Переключение источников видео"
                      />
                    </div>
                  ) : null}

                  {seasons.length > 0 ? (
                    <div className="space-y-3">
                      {seasons.length > 1 ? (
                        <div className="flex flex-wrap gap-2">
                          {seasons.map((season, index) => {
                            const seasonLabel =
                              typeof season.name === 'number' || /^\d+$/.test(String(season.name))
                                ? `Сезон ${season.name}`
                                : String(season.name)
                            return (
                              <button
                                key={`${season.name}-${index}`}
                                type="button"
                                onClick={() => {
                                  setSeasonIndex(index)
                                  setEpisodeIndex(0)
                                }}
                                className={[
                                  'rounded-full border px-3.5 py-1.5 text-[var(--text-small)] transition-colors',
                                  index === seasonIndex
                                    ? 'border-transparent bg-gradient-prism font-medium text-text-primary'
                                    : 'border-frost text-text-secondary hover:text-text-primary',
                                ].join(' ')}
                              >
                                {seasonLabel}
                              </button>
                            )
                          })}
                        </div>
                      ) : null}

                      <div className="flex flex-wrap gap-2">
                        {currentSeason?.series.map((series, index) => (
                          <button
                            key={`${series.id}-${index}`}
                            type="button"
                            onClick={() => setEpisodeIndex(index)}
                            className={[
                              'h-9 min-w-9 rounded-full px-3 font-mono text-[12px] transition-colors',
                              index === episodeIndex
                                ? 'bg-gradient-flux font-semibold text-void'
                                : 'border border-frost text-text-secondary hover:text-text-primary',
                            ].join(' ')}
                            title={series.name}
                          >
                            {index + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="font-mono text-[11px] text-text-muted">
                      Полнометражный тайтл · серии не требуются
                    </p>
                  )}
                </motion.footer>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}