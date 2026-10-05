'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@kinoox/design-system'
import type { AppPlatform, SystemStatsDTO } from '@kinoox/api-client'
import { api } from '@/lib/api'

interface Feature {
  title: string
  description: string
  icon: React.ReactNode
}

const iconProps = {
  width: 26,
  height: 26,
  viewBox: '0 0 28 28',
  fill: 'none',
  'aria-hidden': true as const,
}

/** Сетка 3×2 с возможностями приложений. Каждая фича — иконка с градиентом aura. */
const FEATURES: Feature[] = [
  {
    title: 'Тысячи тайтлов',
    description: 'Фильмы, сериалы, мультфильмы и аниме — единый каталог с фильтрами по жанру и году.',
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="5" width="22" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 10h22M9 5v16M19 5v16" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    title: 'Мгновенный плеер',
    description: 'Переключение источников Vibix и Veoveo в один тап — если один не отвечает, работает другой.',
    icon: (
      <svg {...iconProps}>
        <path d="M11 9l8 5-8 5z" fill="currentColor" />
        <circle cx="14" cy="14" r="11" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    title: 'Закладки и история',
    description: 'Синхронизация между всеми устройствами: начали в браузере — продолжили на телефоне.',
    icon: (
      <svg {...iconProps}>
        <path
          d="M14 22S5 16.5 5 10.8A5 5 0 0114 7.6a5 5 0 019 3.2C23 16.5 14 22 14 22z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'Уведомления',
    description: 'Push-уведомления о выходе новых серий: Firebase Cloud Messaging на Android, APNs на iOS.',
    icon: (
      <svg {...iconProps}>
        <path
          d="M14 4a6 6 0 00-6 6v4l-1.6 3.2a.7.7 0 00.63 1.02h13.94a.7.7 0 00.63-1.02L20 14v-4a6 6 0 00-6-6z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M11.5 21.5a2.5 2.5 0 005 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Офлайн-каталог',
    description: 'Описания и постеры доступны без интернета — на мобильных устройствах.',
    icon: (
      <svg {...iconProps}>
        <path
          d="M14 5v13M9.5 9.5L14 5l4.5 4.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M5 19v2a2 2 0 002 2h14a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Нативный опыт',
    description: 'Жесты, Picture-in-Picture, системный трей и горячие клавиши — на десктопе и мобильных.',
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="6" width="22" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <rect x="16" y="13" width="8" height="6" rx="1.5" fill="currentColor" opacity="0.85" />
        <path d="M8 10h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
]

export function FeatureShowcase() {
  return (
    <section className="kx-container py-16">
      <header className="mb-10">
        <h2 className="font-display text-[var(--text-h2)] font-semibold tracking-[-0.02em] text-text-primary">
          Что умеют приложения
        </h2>
        <p className="mt-2 max-w-2xl text-[var(--text-small)] text-text-secondary">
          Полноценные нативные клиенты, а не веб-обёртка: работают быстрее, поддерживают офлайн,
          push-уведомления и системную интеграцию.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <motion.article
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="group rounded-[20px] border border-frost bg-abyss p-6 transition-[transform,box-shadow,border-color] duration-300 ease-flow hover:-translate-y-1 hover:border-[rgba(0,229,199,0.3)] hover:shadow-glow-aura"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-aura text-void">
              {feature.icon}
            </span>
            <h3 className="mt-5 font-display text-[var(--text-h3)] font-semibold text-text-primary">
              {feature.title}
            </h3>
            <p className="mt-2 text-[var(--text-small)] leading-relaxed text-text-secondary">
              {feature.description}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  )
}

export interface ScreenshotsGalleryProps {
  screenshots: Record<AppPlatform, string[]>
}

/**
 * Горизонтальная галерея скриншотов: меняется по выбранной платформе,
 * при клике открывается полноэкранный просмотр с zoom, при скролле — параллакс.
 */
export function ScreenshotsGallery({ screenshots }: ScreenshotsGalleryProps) {
  const platforms = Object.keys(screenshots) as AppPlatform[]
  const [active, setActive] = React.useState<AppPlatform>(platforms[0] ?? 'android')
  const [zoomed, setZoomed] = React.useState<string | null>(null)
  const railRef = React.useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = React.useState(0)

  const items = screenshots[active] ?? []

  // Параллакс: считаем прогресс горизонтальной прокрутки
  React.useEffect(() => {
    const rail = railRef.current
    if (!rail) return undefined

    const onScroll = () => {
      const max = rail.scrollWidth - rail.clientWidth
      setScrollProgress(max > 0 ? rail.scrollLeft / max : 0)
    }

    rail.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => rail.removeEventListener('scroll', onScroll)
  }, [active])

  // Esc закрывает полноэкранный просмотр
  React.useEffect(() => {
    if (!zoomed) return undefined
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setZoomed(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [zoomed])

  return (
    <section className="py-16">
      <div className="kx-container">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-[var(--text-h2)] font-semibold tracking-[-0.02em] text-text-primary">
              Как это выглядит
            </h2>
            <p className="mt-2 text-[var(--text-small)] text-text-secondary">
              Скриншоты приложения. Нажмите на изображение, чтобы увеличить.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {platforms.map((platform) => (
              <button
                key={platform}
                type="button"
                onClick={() => setActive(platform)}
                className={[
                  'rounded-full border px-4 py-2 text-[var(--text-small)] capitalize transition-colors',
                  platform === active
                    ? 'border-transparent bg-gradient-prism font-medium text-text-primary'
                    : 'border-frost text-text-secondary hover:text-text-primary',
                ].join(' ')}
              >
                {platform}
              </button>
            ))}
          </div>
        </header>
      </div>

      <div
        ref={railRef}
        className="kx-scroller px-[clamp(1rem,4vw,4rem)]"
        aria-label={`Скриншоты приложения для ${active}`}
      >
        {items.length > 0 ? (
          items.map((src, index) => (
            <motion.button
              key={src}
              type="button"
              onClick={() => setZoomed(src)}
              style={{
                // Параллакс: карточки чуть смещаются относительно прокрутки
                transform: `translateX(${-scrollProgress * 24}px)`,
              }}
              className="w-[280px] shrink-0 overflow-hidden rounded-[20px] border border-frost bg-abyss transition-shadow duration-300 hover:shadow-card-hover sm:w-[360px]"
              aria-label={`Открыть скриншот ${index + 1}`}
            >
              <img
                src={src}
                alt={`Скриншот KINOOX для ${active}, ${index + 1}`}
                width={360}
                height={780}
                loading="lazy"
                className="h-[520px] w-full object-cover sm:h-[620px]"
              />
            </motion.button>
          ))
        ) : (
          <div className="mx-4 w-full rounded-[20px] border border-dashed border-frost px-8 py-16 text-center text-text-secondary">
            Скриншоты появятся после публикации сборки для {active}.
          </div>
        )}
      </div>

      {zoomed ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр скриншота"
          className="fixed inset-0 z-[400] flex items-center justify-center bg-[rgba(6,7,10,0.92)] p-4 backdrop-blur-[20px]"
          onClick={() => setZoomed(null)}
        >
          <img
            src={zoomed}
            alt="Увеличенный скриншот KINOOX"
            className="max-h-[90vh] w-auto max-w-full rounded-[20px] border border-frost"
            onClick={(event) => event.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setZoomed(null)}
            aria-label="Закрыть просмотр"
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-frost bg-abyss text-text-secondary hover:text-text-primary"
          >
            ✕
          </button>
        </div>
      ) : null}
    </section>
  )
}

export interface StatsBarProps {
  stats?: Array<{ label: string; value: number; suffix?: string; decimals?: number }>
  initialStats?: SystemStatsDTO | null
}

/** StatsBar: числа с count-up анимацией при попадании во вьюпорт и живым автообновлением */
export function StatsBar({ stats: customStats, initialStats }: StatsBarProps) {
  const [liveStats, setLiveStats] = React.useState<SystemStatsDTO>(
    initialStats ?? {
      titlesCount: 0,
      usersCount: 0,
      averageRating: 0,
      downloadsCount: 0,
    },
  )

  React.useEffect(() => {
    if (customStats) return

    let mounted = true
    async function fetchStats() {
      try {
        const fresh = await api.system.stats()
        if (mounted && fresh) {
          setLiveStats(fresh)
        }
      } catch {
        // Игнорируем сетевые сбои
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 20_000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [customStats])

  const statsList = customStats ?? [
    {
      label: 'тайтлов',
      value: liveStats.titlesCount,
      suffix: liveStats.titlesCount >= 1000 ? '+' : '',
    },
    {
      label: 'пользователей',
      value: liveStats.usersCount,
      suffix: liveStats.usersCount >= 1000 ? '+' : '',
    },
    {
      label: 'рейтинг',
      value: liveStats.averageRating,
      suffix: '★',
      decimals: 1,
    },
    {
      label: 'загрузок',
      value: liveStats.downloadsCount,
      suffix: liveStats.downloadsCount >= 1000 ? '+' : '',
    },
  ]

  return (
    <section className="border-y border-frost bg-abyss">
      <div className="kx-container grid grid-cols-2 gap-8 py-12 lg:grid-cols-4">
        {statsList.map((stat) => (
          <CountUp key={stat.label} {...stat} />
        ))}
      </div>
    </section>
  )
}

function CountUp({
  label,
  value,
  suffix = '',
  decimals = 0,
}: {
  label: string
  value: number
  suffix?: string
  decimals?: number
}) {
  const [display, setDisplay] = React.useState(0)
  const [inView, setInView] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const prevValue = React.useRef(0)

  React.useEffect(() => {
    const element = ref.current
    if (!element) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          setInView(true)
        }
      },
      { threshold: 0.2 },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    if (!inView) return

    const startVal = prevValue.current
    const endVal = value
    const duration = 1200
    const startTime = performance.now()

    let frameId: number
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = startVal + (endVal - startVal) * eased
      setDisplay(current)
      if (progress < 1) {
        frameId = requestAnimationFrame(tick)
      } else {
        prevValue.current = endVal
      }
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [inView, value])

  const formatted =
    decimals > 0
      ? display.toLocaleString('ru-RU', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : Math.round(display).toLocaleString('ru-RU')

  return (
    <div ref={ref} className="text-center lg:text-left">
      <p className="font-display text-[var(--text-h1)] font-bold tracking-[-0.02em] text-text-primary transition-all duration-300">
        {formatted}
        {suffix}
      </p>
      <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
        {label}
      </p>
    </div>
  )
}