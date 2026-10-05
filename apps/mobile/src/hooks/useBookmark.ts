/**
 * Хук закладок: добавление, удаление и синхронизация статуса «сердце».
 */
import { useCallback, useEffect, useState } from 'react'
import * as Haptics from 'expo-haptics'
import type { BookmarkStatus } from '@kinoox/api-client'
import { api } from '../lib/api'

export interface UseBookmarkResult {
  bookmarked: boolean
  status: BookmarkStatus
  loading: boolean
  toggling: boolean
  /** true, когда сработала анимация heart-burst */
  burst: boolean
  toggle(): Promise<void>
  setStatus(next: BookmarkStatus): Promise<void>
}

export function useBookmark(titleId: number, enabled = true): UseBookmarkResult {
  const [bookmarked, setBookmarked] = useState(false)
  const [status, setStatusState] = useState<BookmarkStatus>('watching')
  const [loading, setLoading] = useState(enabled)
  const [toggling, setToggling] = useState(false)
  const [burst, setBurst] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return undefined
    }

    let cancelled = false
    api.user
      .bookmarkStatus(titleId)
      .then((result) => {
        if (cancelled) return
        setBookmarked(result.bookmarked)
        if (result.status) setStatusState(result.status as BookmarkStatus)
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [titleId, enabled])

  const toggle = useCallback(async () => {
    setToggling(true)
    setBurst(true)
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setTimeout(() => setBurst(false), 560)

    try {
      if (bookmarked) {
        await api.user.removeBookmark(titleId)
        setBookmarked(false)
      } else {
        await api.user.addBookmark({ titleId, status })
        setBookmarked(true)
      }
    } catch {
      setBookmarked((value) => !value)
    } finally {
      setToggling(false)
    }
  }, [bookmarked, status, titleId])

  const changeStatus = useCallback(
    async (next: BookmarkStatus) => {
      setStatusState(next)
      try {
        await api.user.updateBookmark(titleId, { status: next })
        setBookmarked(true)
      } catch {
        // состояние подтянется при следующем открытии экрана
      }
    },
    [titleId],
  )

  return {
    bookmarked,
    status,
    loading,
    toggling,
    burst,
    toggle,
    setStatus: changeStatus,
  }
}
