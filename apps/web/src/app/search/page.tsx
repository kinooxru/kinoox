import type { Metadata } from 'next'
import Link from 'next/link'
import { TitleGrid } from '@/components/catalog/TitleCard'
import { api } from '@/lib/api'
import { plural } from '@kinoox/design-system/utils'
import type { TitleCardDTO, TitleType } from '@kinoox/api-client'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}): Promise<Metadata> {
  const query = typeof searchParams.q === 'string' ? searchParams.q : ''
  return {
    title: query ? `Поиск: ${query}` : 'Поиск',
    description: query
      ? `Результаты поиска «${query}» в онлайн-кинотеатре KINOOX.`
      : 'Поиск фильмов, сериалов, мультфильмов и аниме в каталоге KINOOX.',
    alternates: { canonical: '/search' },
    robots: { index: false, follow: true },
  }
}

const TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Всё' },
  { value: 'movie', label: 'Фильмы' },
  { value: 'serial', label: 'Сериалы' },
  { value: 'cartoon', label: 'Мультфильмы' },
  { value: 'anime', label: 'Аниме' },
]

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const query = typeof searchParams.q === 'string' ? searchParams.q.trim() : ''
  const typeRaw = typeof searchParams.type === 'string' ? searchParams.type : ''
  const page = Math.max(1, Number(searchParams.page) || 1)

  let items: TitleCardDTO[] = []
  let total = 0
  let totalPages = 1
  let trending: string[] = []

  if (!query) {
    trending = await api.search.trending(12).catch(() => [])
  } else {
    try {
      const result = await api.search.search({
        q: query,
        type: (typeRaw || undefined) as TitleType | undefined,
        page,
        perPage: 24,
      })
      items = result.items
      total = result.meta.total
      totalPages = result.meta.totalPages
    } catch {
      items = []
    }
  }

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    const type = overrides.type ?? typeRaw
    if (type) params.set('type', type)
    const targetPage = overrides.page ?? (overrides.type !== undefined ? undefined : String(page))
    if (targetPage && targetPage !== '1') params.set('page', targetPage)
    const serialized = params.toString()
    return serialized ? `/search?${serialized}` : '/search'
  }

  return (
    <div className="kx-container py-12">
      <header className="mb-8">
        <h1 className="font-display text-[var(--text-h1)] font-bold tracking-[-0.02em] text-text-primary">
          Поиск
        </h1>
        {query ? (
          <p className="mt-3 text-[var(--text-body)] text-text-secondary">
            {total > 0
              ? `Найдено ${total} ${plural(total, 'тайтл', 'тайтла', 'тайтлов')} по запросу «${query}»`
              : `По запросу «${query}» ничего не найдено`}
          </p>
        ) : (
          <p className="mt-3 text-[var(--text-body)] text-text-secondary">
            Введите название — поиск работает по русскому и оригинальному названию, а также по жанрам.
          </p>
        )}
      </header>

      {query ? (
        <nav className="mb-8 flex flex-wrap gap-2" aria-label="Фильтр по типу контента">
          {TYPE_OPTIONS.map((option) => {
            const active = option.value === typeRaw
            return (
              <Link
                key={option.value || 'all'}
                href={buildHref({ type: option.value, page: undefined })}
                scroll={false}
                className={[
                  'rounded-full border px-4 py-2 text-[var(--text-small)] transition-colors',
                  active
                    ? 'border-transparent bg-gradient-flux font-medium text-void'
                    : 'border-frost text-text-secondary hover:border-[rgba(255,61,110,0.45)] hover:text-text-primary',
                ].join(' ')}
              >
                {option.label}
              </Link>
            )
          })}
        </nav>
      ) : null}

      {!query ? (
        trending.length > 0 ? (
          <section>
            <h2 className="mb-4 font-display text-[var(--text-h2)] font-semibold">
              Популярные запросы
            </h2>
            <div className="flex flex-wrap gap-2">
              {trending.map((item) => (
                <Link
                  key={item}
                  href={`/search?q=${encodeURIComponent(item)}`}
                  className="rounded-full border border-frost px-4 py-2 text-[var(--text-small)] text-text-secondary transition-colors hover:border-[rgba(255,61,110,0.45)] hover:text-text-primary"
                >
                  {item}
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <p className="py-10 text-text-secondary">
            Начните вводить название в строке поиска в шапке сайта.
          </p>
        )
      ) : items.length > 0 ? (
        <>
          <TitleGrid titles={items} />

          {totalPages > 1 ? (
            <nav className="mt-12 flex items-center justify-center gap-3" aria-label="Страницы результатов">
              {page > 1 ? (
                <Link
                  href={buildHref({ page: String(page - 1) })}
                  className="rounded-full border border-frost px-4 py-2 text-[var(--text-small)] text-text-secondary hover:text-text-primary"
                >
                  Назад
                </Link>
              ) : null}
              <span className="font-mono text-[12px] text-text-muted">
                {page} / {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={buildHref({ page: String(page + 1) })}
                  className="rounded-full border border-frost px-4 py-2 text-[var(--text-small)] text-text-secondary hover:text-text-primary"
                >
                  Вперёд
                </Link>
              ) : null}
            </nav>
          ) : null}
        </>
      ) : (
        <div className="rounded-[20px] border border-frost bg-abyss px-6 py-16 text-center">
          <p className="font-display text-[var(--text-h3)] font-semibold text-text-primary">
            Ничего не найдено
          </p>
          <p className="mx-auto mt-3 max-w-md text-[var(--text-small)] text-text-secondary">
            Проверьте написание или попробуйте другой запрос. Возможно, тайтл ещё не добавлен в каталог.
          </p>
        </div>
      )}
    </div>
  )
}