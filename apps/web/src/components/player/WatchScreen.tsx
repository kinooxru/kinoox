'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import type { EpisodeDTO, PlayerSource, TitleDTO } from '@kinoox/api-client'
import { Badge, Button, RatingBadge } from '@kinoox/design-system'
import { Player } from './Player'

/**
 * Экран просмотра: плеер открыт сразу. Если источников нет —
 * показываем понятное состояние с предложением вернуться к описанию.
 */
export function WatchScreen({
  title,
  sources,
  episodes,
}: {
  title: TitleDTO
  sources: PlayerSource[]
  episodes: EpisodeDTO[]
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(true)

  const close = () => {
    setOpen(false)
    router.push(`/title/${title.id}`)
  }

  return (
    <div className="kx-container py-10">
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/title/${title.id}`)}>
          ← К описанию
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-[var(--text-h2)] font-semibold text-text-primary">
            {title.title}
          </h1>
          <RatingBadge rating={title.ratingKp} size="sm" source="КП" />
        </div>
        {sources.length > 0 ? (
          <Badge variant="aura" size="sm" dot>
            Источников: {sources.length}
          </Badge>
        ) : null}
      </div>

      {sources.length === 0 ? (
        <div className="rounded-[20px] border border-frost bg-abyss px-6 py-16 text-center">
          <p className="font-display text-[var(--text-h3)] font-semibold text-text-primary">
            Источники пока недоступны
          </p>
          <p className="mx-auto mt-3 max-w-md text-[var(--text-small)] text-text-secondary">
            Балансеры не отдали ссылку на «{title.title}». Попробуйте обновить страницу через
            минуту — источники проверяются автоматически.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="flux" size="md" onClick={() => router.refresh()}>
              Обновить
            </Button>
            <Button variant="outline" size="md" onClick={() => router.push('/movies')}>
              В каталог
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Player
            titleId={title.id}
            titleName={title.title}
            sources={sources}
            episodes={episodes}
            open={open}
            onClose={close}
          />

          {/* Плейсхолдер под плеером, пока он открыт на весь экран */}
          <div className="rounded-[20px] border border-frost bg-abyss px-6 py-12 text-center">
            <p className="text-[var(--text-small)] text-text-secondary">
              Плеер открыт на весь экран. Нажмите Esc, чтобы вернуться к описанию.
            </p>
            <div className="mt-5 flex justify-center">
              <Button variant="glass" size="md" onClick={() => setOpen(true)}>
                Открыть плеер снова
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}