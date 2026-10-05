'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { TitleCardDTO } from '@kinoox/api-client'
import { RatingBadge, cn } from '@kinoox/design-system'

export interface TitleCardProps {
  title: TitleCardDTO
  /** Приоритет загрузки постера — для первых карточек в ленте */
  priority?: boolean
  /** Размер карточки в карусели */
  variant?: 'grid' | 'rail'
  className?: string
}

const TYPE_LABELS: Record<string, string> = {
  movie: 'Фильм',
  serial: 'Сериал',
  cartoon: 'Мультфильм',
  anime: 'Аниме',
}

/**
 * Карточка тайтла «Cinematic Flow»:
 *  - скругление 20px, мягкое внутреннее свечение по периметру;
 *  - при наведении постер увеличивается, снизу появляется градиентная вуаль с инфо;
 *  - рейтинг — число в круглом бейдже с градиентом flux (>7) или серым (<7);
 *  - мягкое свечение flux-prism за карточкой при наведении.
 */
export function TitleCard({ title, priority = false, variant = 'grid', className }: TitleCardProps) {
  const [hovered, setHovered] = React.useState(false)

  return (
    <Link
      href={`/title/${title.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      aria-label={`${title.title} (${title.year})`}
      className={cn(
        'group relative block rounded-[20px] outline-none',
        'shadow-[inset_0_0_0_1px_rgba(245,247,250,0.06)]',
        'transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        'hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(0,0,0,0.65),0_0_40px_rgba(255,61,110,0.18),0_0_60px_rgba(124,92,255,0.14)]',
        'focus-visible:ring-2 focus-visible:ring-[rgba(255,61,110,0.6)] focus-visible:ring-offset-2 focus-visible:ring-offset-void',
        variant === 'rail' && 'w-[168px] sm:w-[190px]',
        className,
      )}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-[20px] bg-surface">
        {title.posterUrl ? (
          <motion.div
            className="absolute inset-0"
            animate={{ scale: hovered ? 1.08 : 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src={title.posterUrl}
              alt={title.title}
              fill
              priority={priority}
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
              className="object-cover"
            />
          </motion.div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-surface to-frost" />
        )}

        {/* Градиентная вуаль снизу с инфо — проявляется при наведении */}
        <motion.div
          className="kx-card-veil absolute inset-x-0 bottom-0 flex flex-col justify-end p-3.5"
          initial={false}
          animate={{ opacity: hovered ? 1 : 0.72, y: hovered ? 0 : 8 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="line-clamp-2 font-display text-[13px] font-semibold leading-tight text-text-primary">
            {title.title}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-text-secondary">
            {title.year}
            {title.genres.length > 0 ? ` · ${title.genres[0]}` : ''}
          </p>

          <motion.div
            initial={false}
            animate={{ height: hovered ? 'auto' : 0, opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <span className="rounded-full border border-[rgba(245,247,250,0.14)] px-2 py-0.5 text-[10px] text-text-secondary">
                {TYPE_LABELS[title.type] ?? 'Тайтл'}
              </span>
              {title.status === 'ongoing' ? (
                <span className="rounded-full border border-[rgba(0,229,199,0.35)] px-2 py-0.5 text-[10px] text-aura-from">
                  Выходит
                </span>
              ) : null}
            </div>
          </motion.div>
        </motion.div>

        {/* Бейдж рейтинга */}
        <div className="absolute right-3 top-3">
          <RatingBadge rating={title.ratingKp} size="sm" source="КП" />
        </div>
      </div>
    </Link>
  )
}

/** Сетка карточек каталога */
export function TitleGrid({
  titles,
  priorityCount = 6,
}: {
  titles: TitleCardDTO[]
  priorityCount?: number
}) {
  return (
    <div className="kx-grid-titles">
      {titles.map((title, index) => (
        <TitleCard key={title.id} title={title} priority={index < priorityCount} />
      ))}
    </div>
  )
}

/** Горизонтальная карусель карточек — для подборок главной */
export function TitleRail({
  titles,
  priorityCount = 4,
}: {
  titles: TitleCardDTO[]
  priorityCount?: number
}) {
  return (
    <div className="kx-scroller">
      {titles.map((title, index) => (
        <TitleCard
          key={title.id}
          title={title}
          variant="rail"
          priority={index < priorityCount}
        />
      ))}
    </div>
  )
}