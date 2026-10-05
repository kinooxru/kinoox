import React from 'react'
import { cn } from '../utils/cn'

export type CardVariant = 'flat' | 'elevated' | 'glass' | 'interactive'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  /** Внутреннее свечение по периметру */
  rim?: boolean
  /** Свечение flux-prism за карточкой при наведении */
  glowOnHover?: boolean
  padded?: boolean
}

/**
 * Поверхность KINOOX: скруглённая, с мягким внутренним свечением по периметру.
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    variant = 'flat',
    rim = true,
    glowOnHover = false,
    padded = false,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'relative overflow-hidden rounded-[20px] transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        variant === 'flat' && 'bg-[#0C0E14]',
        variant === 'elevated' && 'bg-[#131620] shadow-[0_8px_24px_rgba(0,0,0,0.5)]',
        variant === 'glass' && 'kx-glass',
        variant === 'interactive' && [
          'bg-[#0C0E14] cursor-pointer',
          'hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]',
          'hover:border-[rgba(255,61,110,0.28)]',
        ],
        rim && 'shadow-[var(--shadow-inner-rim)]',
        glowOnHover && 'hover:shadow-[var(--shadow-card-hover)]',
        padded && 'p-5 sm:p-6',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
})

/** Заголовок секции внутри карточки */
export function CardHeader({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-3 flex items-center justify-between gap-3', className)} {...rest} />
}

export function CardTitle({ className, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('font-[var(--font-display)] text-[var(--text-h3)] font-semibold text-[#F5F7FA]', className)}
      {...rest}
    />
  )
}

export function CardDescription({ className, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-[var(--text-small)] text-[#8B92A8]', className)} {...rest} />
}
