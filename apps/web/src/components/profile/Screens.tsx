'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge, Button, Card } from '@kinoox/design-system'
import { useAuth } from '@/components/providers/AuthProvider'
import { TitleGrid } from '@/components/catalog/TitleCard'
import { KinooxLogo } from '@kinoox/design-system'
import type { BookmarkDTO, ViewHistoryDTO } from '@kinoox/api-client'

const STATUS_LABELS: Record<string, string> = {
  watching: 'Смотрю',
  planned: 'В планах',
  completed: 'Просмотрено',
  dropped: 'Брошено',
  on_hold: 'Отложено',
}

/**
 * Оболочка личного кабинета: проверяет сессию, показывает загрузку
 * и предлагает войти, если пользователь не авторизован.
 *
 * `children` — обычный ReactNode, а не функция: серверные компоненты
 * не могут передавать функции в клиентские.
 */
export function RequireAuth({
  children,
  title,
}: {
  children: React.ReactNode
  title: string
}) {
  const router = useRouter()
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="kx-container py-24">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="kx-skeleton h-10 w-1/3 rounded-xl" />
          <div className="kx-skeleton h-32 rounded-[20px]" />
          <div className="kx-skeleton h-32 rounded-[20px]" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="kx-container py-24">
        <div className="mx-auto max-w-md text-center">
          <KinooxLogo size={56} />
          <h1 className="mt-6 font-display text-[var(--text-h1)] font-bold text-text-primary">
            {title}
          </h1>
          <p className="mt-3 text-[var(--text-small)] text-text-secondary">
            Войдите в аккаунт KINOOX, чтобы продолжить.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button variant="flux" size="md" onClick={() => router.push('/login')}>
              Войти
            </Button>
            <Link href="/register">
              <Button variant="outline" size="md">
                Регистрация
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

/** Страница закладок: группировка по статусам */
export function BookmarksScreen() {
  const { api, logout, user } = useAuth()
  const [items, setItems] = React.useState<BookmarkDTO[]>([])
  const [counters, setCounters] = React.useState<Record<string, number>>({})
  const [activeStatus, setActiveStatus] = React.useState<string>('all')
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false

    Promise.all([
      api.user.bookmarks(1, 100),
      api.user.bookmarkCounters().catch(() => ({})),
    ])
      .then(([list, counts]) => {
        if (cancelled) return
        setItems(list.items)
        setCounters(counts)
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [api])

  const filtered = activeStatus === 'all' ? items : items.filter((item) => item.status === activeStatus)

  return (
    <div className="kx-container py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[var(--text-h1)] font-bold tracking-[-0.02em] text-text-primary">
            Закладки
          </h1>
          <p className="mt-2 text-[var(--text-small)] text-text-secondary">
            {user?.username}, здесь хранится всё, что вы смотрите. Синхронизируется между
            устройствами автоматически.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void logout()}>
          Выйти
        </Button>
      </header>

      <div className="mb-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveStatus('all')}
          className={[
            'rounded-full border px-4 py-2 text-[var(--text-small)] transition-colors',
            activeStatus === 'all'
              ? 'border-transparent bg-gradient-flux font-medium text-void'
              : 'border-frost text-text-secondary hover:text-text-primary',
          ].join(' ')}
        >
          Все · {items.length}
        </button>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setActiveStatus(value)}
            className={[
              'rounded-full border px-4 py-2 text-[var(--text-small)] transition-colors',
              activeStatus === value
                ? 'border-transparent bg-gradient-prism font-medium text-text-primary'
                : 'border-frost text-text-secondary hover:text-text-primary',
            ].join(' ')}
          >
            {label} · {counters[value] ?? 0}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="kx-grid-titles">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="kx-skeleton aspect-[2/3] rounded-[20px]" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <TitleGrid titles={filtered.map((item) => item.title)} priorityCount={0} />
      ) : (
        <Card variant="flat" padded className="text-center">
          <p className="font-display text-[var(--text-h3)] font-semibold text-text-primary">
            Пока пусто
          </p>
          <p className="mx-auto mt-3 max-w-md text-[var(--text-small)] text-text-secondary">
            Добавляйте тайтлы в закладки со страницы описания — они появятся здесь.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href="/movies">
              <Button variant="flux" size="md">
                Перейти в каталог
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Прогресс просмотра по закладкам со статусом «Смотрю» */}
      {items.filter((item) => item.status === 'watching').length > 0 ? (
        <section className="mt-14">
          <h2 className="mb-5 font-display text-[var(--text-h2)] font-semibold text-text-primary">
            Продолжить просмотр
          </h2>
          <ul className="space-y-3">
            {items
              .filter((item) => item.status === 'watching')
              .map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/title/${item.titleId}/watch`}
                    className="flex items-center gap-4 rounded-[20px] border border-frost bg-abyss p-4 transition-colors hover:border-[rgba(255,61,110,0.4)]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-[var(--text-body)] font-medium text-text-primary">
                        {item.title.title}
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-text-muted">
                        {item.lastSeason ? `Сезон ${item.lastSeason}` : ''}
                        {item.lastEpisode ? ` · Серия ${item.lastEpisode}` : ''}
                      </p>
                    </div>
                    <Badge variant="flux" size="sm">
                      Продолжить
                    </Badge>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

/** Страница истории просмотров */
export function HistoryScreen() {
  const { api } = useAuth()
  const [items, setItems] = React.useState<ViewHistoryDTO[]>([])
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    try {
      const result = await api.user.history(1, 100)
      setItems(result.items)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [api])

  React.useEffect(() => {
    void load()
  }, [load])

  const clear = async () => {
    await api.user.clearHistory().catch(() => undefined)
    setItems([])
  }

  return (
    <div className="kx-container py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[var(--text-h1)] font-bold tracking-[-0.02em] text-text-primary">
            История просмотра
          </h1>
          <p className="mt-2 text-[var(--text-small)] text-text-secondary">
            Последние {items.length} тайтлов, которые вы открывали.
          </p>
        </div>
        {items.length > 0 ? (
          <Button variant="danger" size="sm" onClick={() => void clear()}>
            Очистить историю
          </Button>
        ) : null}
      </header>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="kx-skeleton h-20 rounded-[20px]" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <TitleGrid titles={items.map((item) => item.title)} priorityCount={0} />
      ) : (
        <Card variant="flat" padded className="text-center">
          <p className="font-display text-[var(--text-h3)] font-semibold text-text-primary">
            История пуста
          </p>
          <p className="mx-auto mt-3 max-w-md text-[var(--text-small)] text-text-secondary">
            Откройте любой тайтл и нажмите «Смотреть» — он появится здесь.
          </p>
        </Card>
      )}
    </div>
  )
}

/** Страница профиля: данные аккаунта и настройки */
export function ProfileScreen() {
  const { api, user, logout, refreshProfile } = useAuth()
  const [username, setUsername] = React.useState(user?.username ?? '')
  const [busy, setBusy] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [counters, setCounters] = React.useState<Record<string, number>>({})
  const [historyCount, setHistoryCount] = React.useState(0)

  React.useEffect(() => {
    setUsername(user?.username ?? '')
  }, [user?.username])

  React.useEffect(() => {
    let cancelled = false
    Promise.all([
      api.user.bookmarkCounters().catch(() => ({})),
      api.user.history(1, 1).catch(() => null),
    ]).then(([counts, history]) => {
      if (cancelled) return
      setCounters(counts)
      setHistoryCount(history?.meta.total ?? 0)
    })
    return () => {
      cancelled = true
    }
  }, [api])

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setMessage(null)
    setError(null)
    try {
      await api.user.updateProfile({ username: username.trim() })
      await refreshProfile()
      setMessage('Профиль обновлён')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось сохранить изменения')
    } finally {
      setBusy(false)
    }
  }

  const totalBookmarks = Object.values(counters).reduce((sum, value) => sum + value, 0)

  return (
    <div className="kx-container py-12">
      <header className="mb-10">
        <h1 className="font-display text-[var(--text-h1)] font-bold tracking-[-0.02em] text-text-primary">
          Профиль
        </h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card variant="glass" padded className="!rounded-[28px]">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-flux font-display text-2xl font-bold text-void">
              {user?.username.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <p className="font-display text-[var(--text-h3)] font-semibold text-text-primary">
                {user?.username}
              </p>
              <p className="font-mono text-[11px] text-text-muted">{user?.email}</p>
            </div>
            {user?.role === 'admin' ? (
              <Badge variant="aura" size="sm" className="ml-auto">
                Администратор
              </Badge>
            ) : null}
          </div>

          <form onSubmit={save} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="profile-username"
                className="text-[var(--text-small)] font-medium text-text-secondary"
              >
                Имя пользователя
              </label>
              <input
                id="profile-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-1.5 h-11 w-full rounded-[12px] border border-frost bg-abyss px-4 text-[var(--text-body)] text-text-primary focus:border-[rgba(255,61,110,0.55)] focus:outline-none"
              />
            </div>

            {message ? (
              <p className="text-[var(--text-small)] text-aura-from">{message}</p>
            ) : null}
            {error ? (
              <p role="alert" className="text-[var(--text-small)] text-[#FF453A]">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="flux" size="md" loading={busy}>
                Сохранить
              </Button>
              <Button type="button" variant="outline" size="md" onClick={() => void logout()}>
                Выйти из аккаунта
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          <Card variant="flat" padded>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              Статистика
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-[var(--text-small)] text-text-secondary">Закладок</dt>
                <dd className="mt-1 font-display text-[var(--text-h2)] font-semibold text-text-primary">
                  {totalBookmarks}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-small)] text-text-secondary">В истории</dt>
                <dd className="mt-1 font-display text-[var(--text-h2)] font-semibold text-text-primary">
                  {historyCount}
                </dd>
              </div>
            </dl>
          </Card>

          <Card variant="flat" padded>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              Быстрые ссылки
            </p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  href="/bookmarks"
                  className="text-[var(--text-small)] text-text-secondary transition-colors hover:text-text-primary"
                >
                  Мои закладки
                </Link>
              </li>
              <li>
                <Link
                  href="/history"
                  className="text-[var(--text-small)] text-text-secondary transition-colors hover:text-text-primary"
                >
                  История просмотра
                </Link>
              </li>
              <li>
                <Link
                  href="/download"
                  className="text-[var(--text-small)] text-text-secondary transition-colors hover:text-text-primary"
                >
                  Приложения для устройств
                </Link>
              </li>
            </ul>
          </Card>

          <Card variant="flat" padded>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              Синхронизация
            </p>
            <p className="mt-3 text-[var(--text-small)] text-text-secondary">
              Закладки и история хранятся на сервере KINOOX, поэтому доступны в браузере,
              на телефоне и в настольном приложении одновременно.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}