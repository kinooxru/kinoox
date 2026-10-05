import React from 'react'
import { cn } from '../utils/cn'

export type BadgeVariant = 'flux' | 'prism' | 'aura' | 'neutral' | 'outline'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  /** Точка-индикатор слева */
  dot?: boolean
}

export function Badge({
  variant = 'neutral',
  size = 'sm',
  dot = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap',
        size === 'sm' ? 'h-6 px-2.5 text-[11px]' : 'h-7 px-3 text-[12px]',
        variant === 'flux' &&
          'bg-[linear-gradient(135deg,rgba(255,61,110,0.16),rgba(255,107,61,0.16))] text-[#FF6B3D] border border-[rgba(255,61,110,0.35)]',
        variant === 'prism' &&
          'bg-[linear-gradient(135deg,rgba(124,92,255,0.16),rgba(92,140,255,0.16))] text-[#8FA6FF] border border-[rgba(124,92,255,0.35)]',
        variant === 'aura' &&
          'bg-[linear-gradient(135deg,rgba(0,229,199,0.14),rgba(0,184,229,0.14))] text-[#00E5C7] border border-[rgba(0,229,199,0.3)]',
        variant === 'neutral' && 'bg-[#1C2030] text-[#8B92A8] border border-transparent',
        variant === 'outline' && 'border border-[#1C2030] text-[#8B92A8] bg-transparent',
        className,
      )}
      {...rest}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </span>
  )
}

export interface RatingBadgeProps {
  /** Рейтинг Кинопоиска или IMDb */
  rating: number | null | undefined
  /** Подпись источника: «КП», «IMDb» */
  source?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Рейтинг — число в круглом бейдже.
 * Больше 7 — градиент flux, иначе — серый.
 */
export function RatingBadge({ rating, source, size = 'md', className }: RatingBadgeProps) {
  const value = typeof rating === 'number' && rating > 0 ? rating.toFixed(1) : '—'
  const high = typeof rating === 'number' && rating > 7

  const dimensions = {
    sm: 'h-8 w-8 text-[12px]',
    md: 'h-10 w-10 text-[14px]',
    lg: 'h-12 w-12 text-[16px]',
  }[size]

  return (
    <span
      title={source ? `Рейтинг ${source}: ${value}` : `Рейтинг: ${value}`}
      className={cn(
        'inline-flex shrink-0 flex-col items-center justify-center rounded-full font-[var(--font-mono)] font-semibold leading-none',
        dimensions,
        high
          ? 'bg-[var(--gradient-flux)] text-[#06070A] shadow-[0_0_20px_rgba(255,61,110,0.35)]'
          : 'bg-[rgba(74,80,104,0.45)] text-[#F5F7FA]',
        className,
      )}
    >
      <span>{value}</span>
      {source ? (
        <span className="mt-0.5 text-[8px] font-medium tracking-[0.08em] opacity-70">{source}</span>
      ) : null}
    </span>
  )
}
