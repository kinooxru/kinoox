import Link from 'next/link'
import type { SystemStatsDTO } from '@kinoox/api-client'
import { Badge, Button } from '@kinoox/design-system'
import { siteConfig } from '@/lib/config'
import { HeroLiveStats } from './HeroLiveStats'

/**
 * Hero главной страницы: полноэкранный баннер с анимированными частицами,
 * логотипом, слоганом и призывом к действию.
 */
export function HeroBanner({
  featuredTitle,
  initialStats,
}: {
  featuredTitle?: string
  initialStats?: SystemStatsDTO | null
}) {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="kx-hero-bg absolute inset-0 -z-10" aria-hidden="true" />

      {/* Анимированные частицы акцентов flux и prism */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        {[
          { top: '12%', left: '8%', size: 180, color: 'rgba(255,61,110,0.22)', delay: '0s' },
          { top: '58%', left: '72%', size: 240, color: 'rgba(124,92,255,0.18)', delay: '1.5s' },
          { top: '32%', left: '46%', size: 140, color: 'rgba(0,229,199,0.14)', delay: '3s' },
          { top: '78%', left: '22%', size: 200, color: 'rgba(255,107,61,0.16)', delay: '2.2s' },
        ].map((particle, index) => (
          <span
            key={index}
            className="absolute rounded-full blur-[80px] animate-float-particles"
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

      <div className="kx-container flex min-h-[82vh] flex-col justify-center py-24">
        <Badge variant="flux" size="md" dot className="mb-6 w-fit">
          Онлайн-кинотеатр нового поколения
        </Badge>

        <h1 className="max-w-4xl font-display text-[var(--text-hero)] font-bold leading-[1.02] tracking-[-0.03em]">
          <span className="kx-gradient-text">KINOOX</span>
          <br />
          <span className="text-text-primary">Смотри. Чувствуй. Погружайся.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-[var(--text-body)] leading-relaxed text-text-secondary">
          Тысячи фильмов, сериалов, мультфильмов и аниме. Мгновенный плеер с переключением
          источников, закладки и история с синхронизацией между всеми устройствами.
          <br className="hidden sm:block" />
          {featuredTitle ? (
            <>
              Сегодня в тренде: <span className="text-text-primary">{featuredTitle}</span>.
            </>
          ) : null}
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link href="/movies">
            <Button variant="flux" size="lg">
              Смотреть каталог
            </Button>
          </Link>
          <Link href="/download">
            <Button variant="glass" size="lg">
              Скачать приложение
            </Button>
          </Link>
        </div>

        <HeroLiveStats initialStats={initialStats} />
      </div>

      <div className="kx-container pb-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
          {siteConfig.domain} · нативные приложения для Android, iOS, Windows, macOS и Linux
        </p>
      </div>
    </section>
  )
}