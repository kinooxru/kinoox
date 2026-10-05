'use client'

import React from 'react'
import type { CommentDTO } from '@kinoox/api-client'
import { Button, Input } from '@kinoox/design-system'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'

/**
 * Комментарии к тайтлу: один уровень ответов, ripple-эффект при лайке,
 * удаление своих комментариев.
 */
export function CommentsSection({ titleId }: { titleId: number }) {
  const router = useRouter()
  const { api, user, isAuthenticated } = useAuth()

  const [comments, setComments] = React.useState<CommentDTO[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [text, setText] = React.useState('')
  const [replyTo, setReplyTo] = React.useState<CommentDTO | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [ripple, setRipple] = React.useState<number | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(
    async (targetPage: number) => {
      try {
        const result = await api.comments.listByTitle(titleId, targetPage, 20)
        setComments(result.items)
        setTotal(result.meta.total)
      } catch {
        setComments([])
      }
    },
    [api, titleId],
  )

  React.useEffect(() => {
    void load(page)
  }, [load, page])

  const submit = async () => {
    if (!isAuthenticated) {
      router.push(`/login?next=/title/${titleId}`)
      return
    }

    const value = text.trim()
    if (!value) return

    setBusy(true)
    setError(null)
    try {
      await api.comments.create(titleId, {
        text: value,
        parentId: replyTo?.id,
      })
      setText('')
      setReplyTo(null)
      await load(page)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось отправить комментарий')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (commentId: number) => {
    try {
      await api.comments.remove(commentId)
      await load(page)
    } catch {
      setError('Не удалось удалить комментарий')
    }
  }

  const like = async (commentId: number) => {
    setRipple(commentId)
    setTimeout(() => setRipple(null), 620)
    try {
      const result = await api.comments.like(commentId)
      setComments((current) =>
        current.map((item) => {
          if (item.id === commentId) return { ...item, likes: result.likesCount } as CommentDTO
          return {
            ...item,
            replies: item.replies?.map((reply) =>
              reply.id === commentId ? ({ ...reply, likes: result.likesCount } as CommentDTO) : reply,
            ),
          }
        }),
      )
    } catch {
      // Лайк не критичен — игнорируем ошибку
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / 20))

  return (
    <section className="py-10" aria-label="Комментарии">
      <header className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-[var(--text-h2)] font-semibold text-text-primary">
          Комментарии
          <span className="ml-2 font-mono text-[var(--text-small)] text-text-muted">{total}</span>
        </h2>
      </header>

      <div className="mb-8 rounded-[20px] border border-frost bg-abyss p-5">
        {replyTo ? (
          <div className="mb-3 flex items-center gap-2 text-[var(--text-small)] text-text-secondary">
            Ответ для <span className="text-text-primary">{replyTo.user.username}</span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="text-prism-from underline underline-offset-4"
            >
              отменить
            </button>
          </div>
        ) : null}

        <Input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={
            isAuthenticated ? 'Поделитесь впечатлением…' : 'Войдите, чтобы оставить комментарий'
          }
          aria-label="Текст комментария"
          maxLength={4000}
        />

        {error ? (
          <p role="alert" className="mt-2 text-[var(--text-small)] text-[#FF453A]">
            {error}
          </p>
        ) : null}

        <div className="mt-3 flex items-center justify-between">
          <span className="font-mono text-[11px] text-text-muted">{text.length} / 4000</span>
          <Button variant="flux" size="sm" loading={busy} onClick={() => void submit()}>
            Отправить
          </Button>
        </div>
      </div>

      {comments.length === 0 ? (
        <p className="py-8 text-center text-text-secondary">
          Комментариев пока нет — будьте первым.
        </p>
      ) : (
        <ul className="space-y-5">
          {comments.map((comment) => (
            <li key={comment.id}>
              <CommentItem
                comment={comment}
                currentUserId={user?.id ?? null}
                isAdmin={user?.role === 'admin'}
                rippleId={ripple}
                onReply={setReplyTo}
                onRemove={remove}
                onLike={like}
              />
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Назад
          </Button>
          <span className="font-mono text-[12px] text-text-muted">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          >
            Вперёд
          </Button>
        </div>
      ) : null}
    </section>
  )
}

interface CommentItemProps {
  comment: CommentDTO
  currentUserId: number | null
  isAdmin: boolean
  rippleId: number | null
  onReply(comment: CommentDTO): void
  onRemove(commentId: number): void
  onLike(commentId: number): void
}

function CommentItem({
  comment,
  currentUserId,
  isAdmin,
  rippleId,
  onReply,
  onRemove,
  onLike,
}: CommentItemProps) {
  const canRemove = currentUserId === comment.userId || isAdmin

  return (
    <article className="rounded-[20px] border border-frost bg-abyss p-5">
      <header className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-prism text-[13px] font-semibold text-text-primary">
          {comment.user.username.slice(0, 1).toUpperCase()}
        </span>
        <div>
          <p className="text-[var(--text-small)] font-medium text-text-primary">
            {comment.user.username}
          </p>
          <p className="font-mono text-[10px] text-text-muted">
            {new Date(comment.createdAt).toLocaleString('ru-RU', {
              day: '2-digit',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </header>

      <p className="mt-4 whitespace-pre-line text-[var(--text-body)] leading-relaxed text-text-primary">
        {comment.text}
      </p>

      <footer className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => onLike(comment.id)}
          className="relative flex items-center gap-1.5 text-[var(--text-small)] text-text-secondary transition-colors hover:text-text-primary"
        >
          {rippleId === comment.id ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -left-1 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[rgba(255,61,110,0.5)] animate-[kx-ripple_600ms_cubic-bezier(0.4,0,0.2,1)]"
            />
          ) : null}
          <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M10 16.5S3 12.4 3 7.9A3.9 3.9 0 0110 5.4a3.9 3.9 0 017 2.5c0 4.5-7 8.6-7 8.6z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          Нравится
        </button>

        <button
          type="button"
          onClick={() => onReply(comment)}
          className="text-[var(--text-small)] text-text-secondary transition-colors hover:text-text-primary"
        >
          Ответить
        </button>

        {canRemove ? (
          <button
            type="button"
            onClick={() => onRemove(comment.id)}
            className="text-[var(--text-small)] text-[#FF453A] transition-opacity hover:opacity-80"
          >
            Удалить
          </button>
        ) : null}
      </footer>

      {comment.replies && comment.replies.length > 0 ? (
        <ul className="mt-5 space-y-4 border-l border-frost pl-5">
          {comment.replies.map((reply) => (
            <li key={reply.id}>
              <CommentItem
                comment={reply}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                rippleId={rippleId}
                onReply={onReply}
                onRemove={onRemove}
                onLike={onLike}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}