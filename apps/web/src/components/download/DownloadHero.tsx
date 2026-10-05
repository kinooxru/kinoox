'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Badge, KinooxLogo } from '@kinoox/design-system'
import type { AppPlatform } from '@kinoox/api-client'

const PLATFORMS: Array<{ id: AppPlatform; label: string }> = [
  { id: 'android', label: 'Android' },
  { id: 'ios', label: 'iOS' },
  { id: 'windows', label: 'Windows' },
  { id: 'macos', label: 'macOS' },
  { id: 'linux', label: 'Linux' },
]

/** Иконки платформ: единый стиль, акцентный цвет задаётся CSS */
function PlatformIcon({ platform, size = 28 }: { platform: AppPlatform; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 32 32',
    'aria-hidden': true as const,
    fill: 'none',
  }

  switch (platform) {
    case 'android':
      return (
        <svg {...common}>
          <path
            d="M6 24V13a10 10 0 0120 0v11z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M4 24h24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="14" r="1.4" fill="currentColor" />
          <circle cx="20" cy="14" r="1.4" fill="currentColor" />
          <path d="M9 6l2 4M23 6l-2 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    case 'ios':
      return (
        <svg {...common}>
          <path
            d="M20.5 9.5c-1.4 0-3 .8-3.9.8-.9 0-2.3-.8-3.6-.8-2.6 0-4.9 2.2-4.9 5.4 0 3.7 2.6 7.4 4.4 7.4.9 0 1.7-.6 2.6-.6.9 0 1.6.6 2.6.6 1.9 0 4.2-3.4 4.2-6.8 0-2.7-1.5-4.6-3.4-5.2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M17.4 8.3c.9-1 1.5-2.4 1.3-3.8-1.3.1-2.8.9-3.7 1.9-.8.9-1.5 2.3-1.3 3.7 1.4.1 2.8-.8 3.7-1.8z" fill="currentColor" />
        </svg>
      )
    case 'windows':
      return (
        <svg {...common}>
          <path d="M5 8l9-1.5v8H5z" fill="currentColor" opacity="0.9" />
          <path d="M16 6.2l11-1.8v9.1H16z" fill="currentColor" opacity="0.9" />
          <path d="M5 16.5h9v8L5 23z" fill="currentColor" opacity="0.9" />
          <path d="M16 16.5h11v9.1l-11-1.8z" fill="currentColor" opacity="0.9" />
        </svg>
      )
    case 'macos':
      return (
        <svg {...common}>
          <rect x="4" y="6" width="24" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 27h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16 23v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M4 19h24" stroke="currentColor" strokeWidth="1.4" opacity="0.5" />
        </svg>
      )
    case 'linux':
      return (
        <svg {...common}>
          <path
            d="M16 4c3.3 0 5 2.6 5 6 0 2.4.8 3.9 2 6.2 1.4 2.6 2 4.4 2 6.1 0 2.9-3.4 5.7-9 5.7s-9-2.8-9-5.7c0-1.7.6-3.5 2-6.1 1.2-2.3 2-3.8 2-6.2 0-3.4 1.7-6 5-6z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="13.5" cy="13" r="1.4" fill="currentColor" />
          <circle cx="18.5" cy="13" r="1.4" fill="currentColor" />
          <path d="M14 22c1.3.9 2.7.9 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    default:
      return null
  }
}

export { PLATFORMS, PlatformIcon }

/**
 * DownloadHero — полноэкранный баннер страницы загрузки:
 * анимированные частицы flux/prism, логотип KINOOX, слоган,
 * 5 пульсирующих иконок платформ.
 */
export function DownloadHero() {
  const [activeIndex, setActiveIndex] = React.useState(0)

  // Иконки платформ пульсируют по очереди
  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((index) => (index + 1) % PLATFORMS.length)
    }, 900)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative isolate overflow-hidden">
      <div className="kx-hero-bg absolute inset-0 -z-10" aria-hidden="true" />

      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        {[
          { top: '14%', left: '10%', size: 220, color: 'rgba(255,61,110,0.2)', delay: '0s' },
          { top: '62%', left: '76%', size: 260, color: 'rgba(124,92,255,0.18)', delay: '1.8s' },
          { top: '34%', left: '44%', size: 160, color: 'rgba(0,229,199,0.14)', delay: '3.2s' },
        ].map((particle, index) => (
          <span
            key={index}
            className="absolute rounded-full blur-[90px] animate-float-particles"
            style={{
              top: particle.top,
              left: particle.left,
              width: particle.size,
              height: particle.size,
              background: particle.color,
              animationDelay: particle.delay,
            }}
          />
        ))}
      </div>

      <div className="kx-container flex min-h-[76vh] flex-col items-center justify-center py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <KinooxLogo size={92} />
        </motion.div>

        <h1 className="mt-8 font-display text-[var(--text-hero)] font-bold tracking-[0.22em] text-text-primary">
          KINOOX
        </h1>
        <p className="mt-4 font-display text-[var(--text-h2)] text-text-secondary">
          Смотри. Чувствуй. Погружайся.
        </p>

        <div className="mt-12 flex items-center gap-6 sm:gap-10">
          {PLATFORMS.map((platform, index) => (
            <a
              key={platform.id}
              href={`#${platform.id}`}
              aria-label={`Приложение для ${platform.label}`}
              className={[
                'flex flex-col items-center gap-2 transition-colors',
                index === activeIndex ? 'text-flux-from' : 'text-text-muted hover:text-text-secondary',
              ].join(' ')}
            >
              <motion.span
                animate={index === activeIndex ? { scale: [1, 1.14, 1] } : { scale: 1 }}
                transition={{ duration: 0.9, ease: 'easeInOut' }}
              >
                <PlatformIcon platform={platform.id} size={34} />
              </motion.span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em]">
                {platform.label}
              </span>
            </a>
          ))}
        </div>

        <p className="mt-12 max-w-2xl text-[var(--text-body)] text-text-secondary">
          Полноценные приложения для всех ваших устройств. Не PWA — нативные.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Badge variant="flux" size="md">
            React Native для Android и iOS
          </Badge>
          <Badge variant="prism" size="md">
            Tauri 2 для Windows, macOS и Linux
          </Badge>
          <Badge variant="aura" size="md">
            ~5–10 МБ вместо 80+ МБ
          </Badge>
        </div>
      </div>
    </section>
  )
}