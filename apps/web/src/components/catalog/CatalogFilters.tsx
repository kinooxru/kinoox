'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Badge, Button, Tabs } from '@kinoox/design-system'
import type { FilterOptionsDTO, SortOption, TitleType } from '@kinoox/api-client'

export interface CatalogFiltersProps {
  /** Тип тайтла фиксирован страницей раздела; на общей странице — undefined */
  fixedType?: TitleType
  options: FilterOptionsDTO
  total: number
}

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'popular', label: 'Популярные' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'year', label: 'По году' },
  { value: 'newest', label: 'Новые' },
]

/**
 * Панель фильтров каталога: жанр, год, сортировка.
 * Состояние живёт в URL — ссылку можно скопировать и отправить.
 */
export function CatalogFilters({ fixedType, options, total }: CatalogFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const genre = searchParams.get('genre') ?? ''
  const year = searchParams.get('year') ?? ''
  const sort = (searchParams.get('sort') as SortOption | null) ?? 'popular'
  const [expanded, setExpanded] = React.useState(false)

  const push = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') params.delete(key)
      else params.set(key, value)
    }
    // Любая смена фильтра возвращает на первую страницу
    params.delete('page')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const visibleGenres = expanded ? options.genres : options.genres.slice(0, 12)
  const hasActiveFilters = Boolean(genre || year)

  return (
    <section className="space-y-5" aria-label="Фильтры каталога">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Tabs
          items={SORT_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
          value={sort}
          onChange={(value) => push({ sort: value })}
          variant="pill"
          ariaLabel="Сортировка"
        />

        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted">
            {total.toLocaleString('ru-RU')} тайтлов
          </span>
          {hasActiveFilters ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => push({ genre: null, year: null })}
            >
              Сбросить
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => push({ genre: null })}
          className={[
            'rounded-full border px-3.5 py-1.5 text-[var(--text-small)] transition-colors',
            genre === ''
              ? 'border-transparent bg-gradient-flux font-medium text-void'
              : 'border-frost text-text-secondary hover:border-[rgba(255,61,110,0.45)] hover:text-text-primary',
          ].join(' ')}
        >
          Все жанры
        </button>

        {visibleGenres.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => push({ genre: item === genre ? null : item })}
            className={[
              'rounded-full border px-3.5 py-1.5 text-[var(--text-small)] transition-colors',
              item === genre
                ? 'border-transparent bg-gradient-flux font-medium text-void'
                : 'border-frost text-text-secondary hover:border-[rgba(255,61,110,0.45)] hover:text-text-primary',
            ].join(' ')}
          >
            {item}
          </button>
        ))}

        {options.genres.length > 12 ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="rounded-full border border-frost px-3.5 py-1.5 text-[var(--text-small)] text-text-muted transition-colors hover:text-text-primary"
          >
            {expanded ? 'Свернуть' : `Ещё ${options.genres.length - 12}`}
          </button>
        ) : null}
      </div>

      {options.years.length > 0 ? (
        <div className="kx-scroller gap-2 pb-1">
          <button
            type="button"
            onClick={() => push({ year: null })}
            className={[
              'rounded-full border px-3.5 py-1.5 font-mono text-[11px] transition-colors',
              year === ''
                ? 'border-[rgba(124,92,255,0.5)] text-prism-from'
                : 'border-frost text-text-muted hover:text-text-primary',
            ].join(' ')}
          >
            Все годы
          </button>
          {options.years.slice(0, 30).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => push({ year: String(item) })}
              className={[
                'rounded-full border px-3.5 py-1.5 font-mono text-[11px] transition-colors',
                String(item) === year
                  ? 'border-[rgba(124,92,255,0.5)] text-prism-from'
                  : 'border-frost text-text-muted hover:text-text-primary',
              ].join(' ')}
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}

      {fixedType ? (
        <div className="flex items-center gap-2">
          <Badge variant="outline" size="sm">
            Раздел: {fixedType}
          </Badge>
        </div>
      ) : null}
    </section>
  )
}

/** Постраничная навигация каталога */
export function CatalogPagination({
  page,
  totalPages,
}: {
  page: number
  totalPages: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  if (totalPages <= 1) return null

  const go = (target: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (target <= 1) params.delete('page')
    else params.set('page', String(target))
    router.push(`?${params.toString()}`, { scroll: true })
  }

  const pages: number[] = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, start + 4)
  for (let index = start; index <= end; index += 1) pages.push(index)

  return (
    <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Постраничная навигация">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => go(page - 1)}>
        Назад
      </Button>

      {pages.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => go(item)}
          aria-current={item === page ? 'page' : undefined}
          className={[
            'h-9 min-w-9 rounded-full px-3 font-mono text-[12px] transition-colors',
            item === page
              ? 'bg-gradient-flux font-semibold text-void'
              : 'border border-frost text-text-secondary hover:text-text-primary',
          ].join(' ')}
        >
          {item}
        </button>
      ))}

      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => go(page + 1)}>
        Вперёд
      </Button>
    </nav>
  )
}