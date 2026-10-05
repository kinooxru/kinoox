'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { BookmarkStatus, TitleDTO } from '@kinoox/api-client'
import { Button } from '@kinoox/design-system'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'

const STATUS_LABELS: Record<BookmarkStatus, string> = {
  watching: 'Смотрю',
  planned: 'В планах',
  completed: 'Просмотрено',
  dropped: 'Брошено',
  on_hold: 'Отложено',
}

/**
 * Кнопки действий над тайтлом: «Смотреть», «В закладки» (heart-burst),
 * выбор статуса и подписка на новые серии.
 */
export function TitleActions({ title }: { title: TitleDTO }) {
  const router = useRouter()
  const { api, isAuthenticated } = useAuth()

  const [bookmarked, setBookmarked] = React.useState(false)
  const [status, setStatus] = React.useState<BookmarkStatus>('watching')
  const [burst, setBurst] = React.useState(false)
  const [statusOpen, setStatusOpen] = React.useState(false)
  const [busy, setBusy] = React.useState(false)

  // Узнаём состояние закладки при монтировании
  React.useEffect(() => {
    if (!isAuthenticated) {
      setBookmarked(false)
      return
    }

    let cancelled = false
    api.user
      .bookmarkStatus(title.id)
      .then((result) => {
        if (cancelled) return
        setBookmarked(result.bookmarked)
        if (result.status) setStatus(result.status as BookmarkStatus)
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [api, isAuthenticated, title.id])

  const requireAuth = () => {
    router.push(`/login?next=/title/${title.id}`)
  }

  const toggleBookmark = async () => {
    if (!isAuthenticated) {
      requireAuth()
      return
    }

    setBusy(true)
    setBurst(true)
    setTimeout(() => setBurst(false), 560)

    try {
      if (bookmarked) {
        await api.user.removeBookmark(title.id)
        setBookmarked(false)
      } else {
        await api.user.addBookmark({ titleId: title.id, status })
        setBookmarked(true)
      }
    } catch {
      // Возвращаем прежнее состояние при ошибке
      setBookmarked((value) => !value)
    } finally {
      setBusy(false)
    }
  }

  const changeStatus = async (next: BookmarkStatus) => {
    if (!isAuthenticated) {
      requireAuth()
      return
    }

    setStatus(next)
    setStatusOpen(false)
    try {
      await api.user.updateBookmark(title.id, { status: next })
      setBookmarked(true)
    } catch {
      // Игнорируем: пользователь увидит прежнее состояние после перезагрузки
    }
  }

  const subscribe = async () => {
    if (!isAuthenticated) {
      requireAuth()
      return
    }
    try {
      await api.system.subscribe(title.id)
      router.push('/profile')
    } catch {
      // Уведомления можно включить позже в профиле
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="flux" size="lg" onClick={() => router.push(`/title/${title.id}/watch`)}>
        Смотреть
      </Button>

      <div className="relative">
        <motion.div animate={burst ? { scale: [1, 1.35, 0.92, 1.08, 1] } : { scale: 1 }} transition={{ duration: 0.52 }}>
          <Button
            variant={bookmarked ? 'prism' : 'glass'}
            size="lg"
            loading={busy}
            onClick={() => void toggleBookmark()}
            iconLeft={
              <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  d="M10 16.5S3 12.4 3 7.9A3.9 3.9 0 0110 5.4a3.9 3.9 0 017 2.5c0 4.5-7 8.6-7 8.6z"
                  fill={bookmarked ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            }
          >
            {bookmarked ? 'В закладках' : 'В закладки'}
          </Button>
        </motion.div>

        {bookmarked ? (
          <button
            type="button"
            onClick={() => setStatusOpen((value) => !value)}
            aria-label="Изменить статус просмотра"
            aria-expanded={statusOpen}
            className="absolute -bottom-6 left-1 text-[11px] text-text-muted underline-offset-4 hover:text-text-secondary hover:underline"
          >
            {STATUS_LABELS[status]}
          </button>
        ) : null}

        {statusOpen ? (
          <div className="absolute left-0 top-full z-20 mt-9 w-44 overflow-hidden rounded-2xl border border-frost bg-[rgba(12,14,20,0.97)] backdrop-blur-[20px]">
            {(Object.keys(STATUS_LABELS) as BookmarkStatus[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => void changeStatus(value)}
                className={[
                  'block w-full px-4 py-2.5 text-left text-[var(--text-small)] transition-colors',
                  value === status
                    ? 'bg-surface text-text-primary'
                    : 'text-text-secondary hover:bg-surface hover:text-text-primary',
                ].join(' ')}
              >
                {STATUS_LABELS[value]}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <Button variant="outline" size="lg" onClick={() => void subscribe()}>
        Уведомлять о сериях
      </Button>
    </div>
  )
}