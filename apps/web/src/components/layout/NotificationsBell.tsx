'use client'

import React from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import type { NotificationDTO } from '@kinoox/api-client'
import { useAuth } from '@/components/providers/AuthProvider'
import { useSocketEvent } from '@/components/providers/SocketProvider'

/**
 * Колокольчик уведомлений: список новых серий и системных сообщений.
 * Обновляется в реальном времени по Socket.io.
 */
export function NotificationsBell() {
  const { api } = useAuth()
  const [open, setOpen] = React.useState(false)
  const [items, setItems] = React.useState<NotificationDTO[]>([])
  const containerRef = React.useRef<HTMLDivElement>(null)

  const unreadCount = items.filter((item) => !item.read).length

  // Первичная загрузка
  React.useEffect(() => {
    let cancelled = false
    api.system
      .notifications()
      .then((list) => {
        if (!cancelled) setItems(list)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [api])

  // Новое уведомление по Socket.io
  useSocketEvent<NotificationDTO>('notification', (payload) => {
    setItems((current) => [payload, ...current].slice(0, 50))
  })

  // Закрытие по клику вне
  React.useEffect(() => {
    if (!open) return undefined

    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const markAllRead = async () => {
    const unreadIds = items.filter((item) => !item.read).map((item) => item.id)
    if (unreadIds.length === 0) return

    setItems((current) => current.map((item) => ({ ...item, read: true })))
    try {
      await api.system.markRead(unreadIds)
    } catch {
      // Локальное состояние уже обновлено — при ошибке просто перезагрузим список
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={unreadCount > 0 ? `Уведомления, новых: ${unreadCount}` : 'Уведомления'}
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-frost bg-[rgba(12,14,20,0.6)] text-text-secondary transition-colors hover:border-[rgba(255,61,110,0.45)] hover:text-text-primary"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M10 2.5a5 5 0 00-5 5v3l-1.2 2.4a.6.6 0 00.54.87h11.32a.6.6 0 00.54-.87L15 10.5v-3a5 5 0 00-5-5z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M8 16.5a2 2 0 004 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-flux px-1 font-mono text-[10px] font-semibold text-void">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-12 w-[min(92vw,380px)] overflow-hidden rounded-[20px] border border-frost bg-[rgba(12,14,20,0.96)] backdrop-blur-[20px]"
          >
            <header className="flex items-center justify-between border-b border-frost px-5 py-4">
              <h2 className="font-display text-[var(--text-body)] font-semibold">Уведомления</h2>
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="text-[var(--text-small)] text-prism-from transition-colors hover:text-text-primary"
                >
                  Прочитать все
                </button>
              ) : null}
            </header>

            <div className="max-h-[380px] overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-5 py-10 text-center text-[var(--text-small)] text-text-secondary">
                  Пока нет уведомлений. Подпишитесь на сериалы — сообщим о новых сериях.
                </p>
              ) : (
                <ul>
                  {items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.titleId ? `/title/${item.titleId}` : '/'}
                        onClick={() => setOpen(false)}
                        className={[
                          'flex gap-3 border-b border-[rgba(28,32,48,0.6)] px-5 py-4 transition-colors last:border-b-0 hover:bg-surface',
                          item.read ? 'opacity-60' : 'opacity-100',
                        ].join(' ')}
                      >
                        <span
                          aria-hidden="true"
                          className={[
                            'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                            item.read ? 'bg-text-muted' : 'bg-gradient-flux',
                          ].join(' ')}
                        />
                        <span className="min-w-0">
                          <span className="block text-[var(--text-small)] text-text-primary">
                            {item.message}
                          </span>
                          <span className="mt-1 block font-mono text-[10px] text-text-muted">
                            {new Date(item.createdAt).toLocaleString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}