'use client'

import React from 'react'
import { cn } from '../utils/cn'

export interface ModalProps {
  open: boolean
  onClose: () => void
  /** Заголовок в верхней части модального окна */
  title?: string
  /** Подпись под заголовком */
  description?: string
  children?: React.ReactNode
  /** Подвал: кнопки действий */
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'full'
  /** Закрывать по клику на подложку */
  closeOnOverlayClick?: boolean
  className?: string
}

const SIZE_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  full: 'max-w-[95vw] h-[90vh]',
} as const

/**
 * Модальное окно KINOOX: стеклянная панель, затемнение фона,
 * переход снизу с масштабированием cubic-bezier(0.16, 1, 0.3, 1).
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  className,
}: ModalProps) {
  React.useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Закрыть"
        tabIndex={-1}
        onClick={closeOnOverlayClick ? onClose : undefined}
        className="absolute inset-0 cursor-default bg-[rgba(6,7,10,0.72)] backdrop-blur-md"
      />

      <div
        className={cn(
          'kx-anim-screen-morph relative z-10 flex w-full flex-col overflow-hidden',
          'rounded-[28px] border border-[#1C2030] bg-[#0C0E14] shadow-[0_32px_80px_rgba(0,0,0,0.75)]',
          SIZE_CLASSES[size],
          className,
        )}
      >
        {title ? (
          <header className="flex items-start justify-between gap-4 border-b border-[#1C2030] p-6">
            <div>
              <h2 className="font-[var(--font-display)] text-[var(--text-h2)] font-semibold text-[#F5F7FA]">
                {title}
              </h2>
              {description ? (
                <p className="mt-1 text-[var(--text-small)] text-[#8B92A8]">{description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#1C2030] text-[#8B92A8] transition-colors hover:border-[rgba(255,61,110,0.45)] hover:text-[#F5F7FA]"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M3 3l10 10M13 3L3 13"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </header>
        ) : null}

        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {footer ? <footer className="border-t border-[#1C2030] p-6">{footer}</footer> : null}
      </div>
    </div>
  )
}
