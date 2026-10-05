'use client'

import React from 'react'
import { cn } from '../utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string | null
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
}

/**
 * Поле ввода KINOOX: тёмная поверхность, акцентная рамка при фокусе,
 * свечение flux при ошибке — нет.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, iconLeft, iconRight, fullWidth = true, className, id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name ?? undefined
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

  return (
    <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
      {label ? (
        <label
          htmlFor={inputId}
          className="text-[var(--text-small)] font-medium text-[#8B92A8]"
        >
          {label}
        </label>
      ) : null}

      <div className="relative flex items-center">
        {iconLeft ? (
          <span className="pointer-events-none absolute left-4 flex text-[#8B92A8]" aria-hidden="true">
            {iconLeft}
          </span>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'h-11 w-full rounded-[12px] border bg-[#0C0E14] px-4 text-[var(--text-body)] text-[#F5F7FA]',
            'placeholder:text-[#4A5068]',
            'transition-[border-color,box-shadow,background-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
            'focus:outline-none focus:bg-[#131620]',
            iconLeft && 'pl-11',
            iconRight && 'pr-11',
            error
              ? 'border-[#FF453A] focus:border-[#FF453A] focus:shadow-[0_0_0_3px_rgba(255,69,58,0.18)]'
              : 'border-[#1C2030] focus:border-[rgba(255,61,110,0.55)] focus:shadow-[0_0_0_3px_rgba(255,61,110,0.14)]',
            className,
          )}
          {...rest}
        />

        {iconRight ? (
          <span className="absolute right-4 flex text-[#8B92A8]">{iconRight}</span>
        ) : null}
      </div>

      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-[var(--text-small)] text-[#FF453A]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-[var(--text-small)] text-[#4A5068]">
          {hint}
        </p>
      ) : null}
    </div>
  )
})
