'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import type { TitleCardDTO } from '@kinoox/api-client'
import { RatingBadge } from '@kinoox/design-system'
import { createBrowserClient } from '@/lib/api'

/**
 * Expandable-поиск: оверлей сверху, живые подсказки через /search/suggest,
 * переход по Ctrl+K или «/».
 */
export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const [suggestions, setSuggestions] = React.useState<TitleCardDTO[]>([])
  const [trending, setTrending] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(-1)

  const inputRef = React.useRef<HTMLInputElement>(null)
  const api = React.useMemo(() => createBrowserClient(), [])

  // Автофокус при открытии
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 80)
      return () => clearTimeout(timer)
    }
    setQuery('')
    setSuggestions([])
    setActiveIndex(-1)
    return undefined
  }, [open])

  // Популярные запросы — при первом открытии
  React.useEffect(() => {
    if (!open || trending.length > 0) return

    let cancelled = false
    api.search
      .trending(8)
      .then((items) => {
        if (!cancelled) setTrending(items)
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [open, trending.length, api])

  // Подсказки с задержкой 200 мс
  React.useEffect(() => {
    if (!query.trim()) {
      setSuggestions([])
      return undefined
    }

    let cancelled = false
    setLoading(true)

    const timer = setTimeout(() => {
      api.search
        .suggest(query.trim(), 8)
        .then((items) => {
          if (!cancelled) setSuggestions(items)
        })
        .catch(() => {
          if (!cancelled) setSuggestions([])
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 200)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, api])

  const submit = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    onClose()
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, -1))
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const picked = activeIndex >= 0 ? suggestions[activeIndex] : null
      if (picked) {
        onClose()
        router.push(`/title/${picked.id}`)
      } else {
        submit(query)
      }
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[300] bg-[rgba(6,7,10,0.86)] backdrop-blur-[20px] backdrop-saturate-150"
          role="dialog"
          aria-modal="true"
          aria-label="Поиск по каталогу"
        >
          <div className="kx-container pt-8">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <svg
                    className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-text-muted"
                    width="18"
                    height="18"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                  >
                    <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M11 11l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value)
                      setActiveIndex(-1)
                    }}
                    onKeyDown={onKeyDown}
                    placeholder="Фильмы, сериалы, мультфильмы, аниме…"
                    aria-label="Поисковый запрос"
                    className="h-14 w-full rounded-full border border-frost bg-abyss pl-14 pr-28 text-[var(--text-body)] text-text-primary placeholder:text-text-muted focus:border-[rgba(255,61,110,0.55)] focus:outline-none focus:shadow-[0_0_0_4px_rgba(255,61,110,0.12)]"
                  />
                  <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-frost px-3 py-1 font-mono text-[10px] text-text-muted transition-colors hover:text-text-primary"
                  >
                    ESC
                  </button>
                </div>
              </div>

              <div className="mt-6 max-h-[60vh] overflow-y-auto">
                {query.trim() ? (
                  loading && suggestions.length === 0 ? (
                    <div className="space-y-2">
                      {Array.from({ length: 4 }, (_, index) => (
                        <div key={index} className="kx-skeleton h-16 rounded-2xl" />
                      ))}
                    </div>
                  ) : suggestions.length > 0 ? (
                    <ul className="space-y-1.5">
                      {suggestions.map((item, index) => (
                        <li key={item.id}>
                          <Link
                            href={`/title/${item.id}`}
                            onClick={onClose}
                            onMouseEnter={() => setActiveIndex(index)}
                            className={[
                              'flex items-center gap-4 rounded-2xl border p-3 transition-colors',
                              index === activeIndex
                                ? 'border-[rgba(255,61,110,0.45)] bg-surface'
                                : 'border-transparent hover:bg-abyss',
                            ].join(' ')}
                          >
                            <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-lg bg-surface">
                              {item.posterUrl ? (
                                <Image
                                  src={item.posterUrl}
                                  alt={item.title}
                                  fill
                                  sizes="44px"
                                  className="object-cover"
                                />
                              ) : null}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-display text-[var(--text-body)] font-medium text-text-primary">
                                {item.title}
                              </p>
                              <p className="truncate text-[var(--text-small)] text-text-secondary">
                                {item.year}
                                {item.genres.length > 0 ? ` · ${item.genres.slice(0, 2).join(', ')}` : ''}
                              </p>
                            </div>
                            <RatingBadge rating={item.ratingKp} size="sm" source="КП" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="py-10 text-center text-text-secondary">
                      По запросу «{query}» ничего не найдено
                    </p>
                  )
                ) : (
                  <div>
                    {trending.length > 0 ? (
                      <>
                        <p className="mb-3 px-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                          Популярные запросы
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {trending.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => submit(item)}
                              className="rounded-full border border-frost px-4 py-2 text-[var(--text-small)] text-text-secondary transition-colors hover:border-[rgba(255,61,110,0.45)] hover:text-text-primary"
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="py-10 text-center text-text-secondary">
                        Начните вводить название — подсказки появятся сразу
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}