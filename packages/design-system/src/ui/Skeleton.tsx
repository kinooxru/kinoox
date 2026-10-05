import React from 'react'
import { cn } from '../utils/cn'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Соотношение сторон, например «2 / 3» для постера */
  aspectRatio?: string
  width?: string | number
  height?: string | number
  rounded?: string
}

/**
 * Скелетон с shimmer-эффектом: пробегающий блик слева направо, 1400 мс.
 */
export function Skeleton({
  aspectRatio,
  width,
  height,
  rounded = '12px',
  className,
  style,
  ...rest
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('kx-skeleton', className)}
      style={{
        aspectRatio,
        width,
        height,
        borderRadius: rounded,
        ...style,
      }}
      {...rest}
    />
  )
}

/** Скелетон карточки тайтла: постер + две строки */
export function TitleCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton aspectRatio="2 / 3" rounded="20px" />
      <Skeleton height="14px" width="80%" rounded="6px" />
      <Skeleton height="12px" width="45%" rounded="6px" />
    </div>
  )
}

/** Сетка скелетонов карточек каталога */
export function TitleGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {Array.from({ length: count }, (_, index) => (
        <TitleCardSkeleton key={index} />
      ))}
    </div>
  )
}

/** Полноэкранная загрузка — пульсирующий логотип KINOOX */
export function FullScreenLoader({ label = 'Загрузка' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[var(--z-overlay)] flex flex-col items-center justify-center gap-6 bg-[#06070A]"
    >
      <KinooxLogo size={72} pulse />
      <span className="sr-only">{label}</span>
      <span className="text-[var(--text-small)] tracking-[0.2em] text-[#4A5068] uppercase">
        Смотри. Чувствуй. Погружайся.
      </span>
    </div>
  )
}

export interface KinooxLogoProps {
  size?: number
  /** Пульсация — на экранах загрузки */
  pulse?: boolean
  /** Показать wordmark рядом со знаком */
  withWordmark?: boolean
  className?: string
}

/**
 * Логотип KINOOX: знак инфузории-туфельки с градиентом flux и wordmark капсом.
 */
export function KinooxLogo({
  size = 40,
  pulse = false,
  withWordmark = false,
  className,
}: KinooxLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        role="img"
        aria-label="KINOOX"
        className={cn(pulse && 'kx-anim-logo-pulse')}
      >
        <defs>
          <linearGradient id="kinoox-flux" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF3D6E" />
            <stop offset="100%" stopColor="#FF6B3D" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="url(#kinoox-flux)" strokeWidth="3" strokeLinecap="round">
          {/* Силуэт инфузории-туфельки: тело и реснички */}
          <path
            d="M22 44c-7-2-12-8-12-15s6-14 14-16c9-2 20 1 26 7 4 4 5 9 2 13-3 4-9 5-15 4-4-1-7-3-11-3-10 0-16 2-18 6-1 2 0 4 2 5 3 2 7 2 12 3"
            fill="none"
          />
          <circle cx="43" cy="22" r="2.4" fill="url(#kinoox-flux)" stroke="none" />
        </g>
        <g stroke="url(#kinoox-flux)" strokeWidth="2" strokeLinecap="round" opacity="0.75">
          <path d="M18 15l-3-4" />
          <path d="M26 12l-1-4" />
          <path d="M34 12l2-4" />
          <path d="M14 24l-5-2" />
          <path d="M12 33l-5 0" />
          <path d="M34 47l2 4" />
          <path d="M26 50l0 4" />
          <path d="M46 45l4 3" />
        </g>
      </svg>

      {withWordmark ? (
        <span className="font-[var(--font-display)] text-[length:calc(var(--text-h2))] font-bold tracking-[0.22em] text-[#F5F7FA]">
          KINOOX
        </span>
      ) : null}
    </span>
  )
}
