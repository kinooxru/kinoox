'use client'

import React from 'react'
import { cn } from '../utils/cn'

export interface TabsItem {
  value: string
  label: string
  /** Иконка слева от подписи */
  icon?: React.ReactNode
  /** Отключить таб */
  disabled?: boolean
  /** Бейдж справа, например «1.0.0» */
  badge?: string
}

export interface TabsProps {
  items: TabsItem[]
  value: string
  onChange: (value: string) => void
  /** Оформление: подчёркивание, капсулы или сегменты */
  variant?: 'underline' | 'pill' | 'segmented'
  /** Растянуть на всю ширину */
  fullWidth?: boolean
  className?: string
  ariaLabel?: string
}

/**
 * Табы KINOOX. Активный индикатор — градиентная полоска flux-prism.
 */
export function Tabs({
  items,
  value,
  onChange,
  variant = 'underline',
  fullWidth = false,
  className,
  ariaLabel,
}: TabsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'relative flex items-center',
        variant === 'underline' && 'gap-6 border-b border-[#1C2030]',
        variant === 'pill' && 'gap-2 flex-wrap',
        variant === 'segmented' && 'gap-1 rounded-full bg-[#0C0E14] p-1 border border-[#1C2030]',
        fullWidth && 'w-full',
        className,
      )}
    >
      {items.map((item) => {
        const isActive = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${item.value}`}
            id={`tab-${item.value}`}
            disabled={item.disabled}
            onClick={() => onChange(item.value)}
            className={cn(
              'relative inline-flex items-center gap-2 whitespace-nowrap font-medium',
              'transition-[color,background-color,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3D6E]/50',
              variant === 'underline' && [
                'h-11 px-1 text-[var(--text-small)]',
                isActive ? 'text-[#F5F7FA]' : 'text-[#8B92A8] hover:text-[#F5F7FA]',
              ],
              variant === 'pill' && [
                'h-9 rounded-full px-4 text-[var(--text-small)] border',
                isActive
                  ? 'border-transparent text-[#06070A] bg-[var(--gradient-flux)] font-semibold'
                  : 'border-[#1C2030] text-[#8B92A8] hover:text-[#F5F7FA] hover:border-[rgba(255,61,110,0.4)]',
              ],
              variant === 'segmented' && [
                'h-9 rounded-full px-4 text-[var(--text-small)]',
                isActive ? 'bg-[#131620] text-[#F5F7FA]' : 'text-[#8B92A8] hover:text-[#F5F7FA]',
              ],
              fullWidth && variant === 'segmented' && 'flex-1 justify-center',
              item.disabled && 'pointer-events-none opacity-40',
            )}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge ? (
              <span className="font-[var(--font-mono)] text-[10px] text-[#4A5068]">
                {item.badge}
              </span>
            ) : null}

            {variant === 'underline' && isActive ? (
              <span
                aria-hidden="true"
                className="absolute -bottom-px left-0 right-0 h-[2px] rounded-full bg-[var(--gradient-flux-prism)]"
              />
            ) : null}

            {variant === 'segmented' && isActive ? (
              <span
                aria-hidden="true"
                className="absolute inset-x-3 -bottom-[3px] h-[2px] rounded-full bg-[var(--gradient-flux-prism)]"
              />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
