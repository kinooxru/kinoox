import Link from 'next/link'
import type { TitleCardDTO } from '@kinoox/api-client'
import { TitleRail } from './TitleCard'
import { cn } from '@kinoox/design-system'

export interface TitleSectionProps {
  title: string
  subtitle?: string
  items: TitleCardDTO[]
  /** Ссылка «смотреть все» */
  href?: string
  className?: string
}

/** Секция подборки на главной: заголовок + горизонтальная карусель. */
export function TitleSection({ title, subtitle, items, href, className }: TitleSectionProps) {
  if (items.length === 0) return null

  return (
    <section className={cn('py-6', className)}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[var(--text-h2)] font-semibold tracking-[-0.02em] text-text-primary">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-[var(--text-small)] text-text-secondary">{subtitle}</p>
          ) : null}
        </div>

        {href ? (
          <Link
            href={href}
            className="group flex shrink-0 items-center gap-1.5 text-[var(--text-small)] text-text-secondary transition-colors hover:text-text-primary"
          >
            Смотреть все
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            >
              <path
                d="M3 7h8M7.5 3.5L11 7l-3.5 3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </Link>
        ) : null}
      </div>

      <TitleRail titles={items} />
    </section>
  )
}