'use client'

import React from 'react'
import { cn } from '../utils/cn'

export type ButtonVariant = 'flux' | 'prism' | 'ghost' | 'glass' | 'outline' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Растянуть на всю ширину контейнера */
  fullWidth?: boolean
  /** Показать индикатор загрузки и заблокировать нажатие */
  loading?: boolean
  /** Иконка слева от текста */
  iconLeft?: React.ReactNode
  /** Иконка справа от текста */
  iconRight?: React.ReactNode
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-[13px] gap-1.5',
  md: 'h-11 px-6 text-[14px] gap-2',
  lg: 'h-14 px-8 text-[15px] gap-2.5',
}

/**
 * Кнопка KINOOX. Градиентные варианты используют акценты flux/prism,
 * при наведении подсвечиваются собственным свечением.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'flux',
    size = 'md',
    fullWidth = false,
    loading = false,
    iconLeft,
    iconRight,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        'kx-button relative inline-flex select-none items-center justify-center overflow-hidden',
        'rounded-full font-medium whitespace-nowrap',
        'transition-[transform,box-shadow,background-color,opacity] duration-200',
        'ease-[cubic-bezier(0.16,1,0.3,1)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3D6E]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06070A]',
        'active:scale-[0.97]',
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        variant === 'flux' && [
          'text-[#06070A] font-semibold',
          'bg-[linear-gradient(135deg,#FF3D6E_0%,#FF6B3D_100%)]',
          'hover:shadow-[0_0_40px_rgba(255,61,110,0.3)]',
          'hover:brightness-110',
        ],
        variant === 'prism' && [
          'text-[#F5F7FA] font-semibold',
          'bg-[linear-gradient(135deg,#7C5CFF_0%,#5C8CFF_100%)]',
          'hover:shadow-[0_0_40px_rgba(124,92,255,0.25)]',
          'hover:brightness-110',
        ],
        variant === 'glass' && [
          'kx-glass text-[#F5F7FA]',
          'hover:bg-[rgba(19,22,32,0.85)] hover:border-[rgba(255,61,110,0.45)]',
        ],
        variant === 'outline' && [
          'border border-[#1C2030] bg-transparent text-[#F5F7FA]',
          'hover:border-[rgba(255,61,110,0.45)] hover:bg-[rgba(255,61,110,0.06)]',
        ],
        variant === 'ghost' && [
          'bg-transparent text-[#8B92A8]',
          'hover:bg-[rgba(28,32,48,0.6)] hover:text-[#F5F7FA]',
        ],
        variant === 'danger' && [
          'bg-[rgba(255,69,58,0.14)] text-[#FF453A] border border-[rgba(255,69,58,0.35)]',
          'hover:bg-[rgba(255,69,58,0.22)]',
        ],
        isDisabled && 'pointer-events-none opacity-45',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span
          className="h-4 w-4 animate-[kx-spin_700ms_linear_infinite] rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : (
        iconLeft
      )}
      {children ? <span>{children}</span> : null}
      {!loading && iconRight}
    </button>
  )
})
