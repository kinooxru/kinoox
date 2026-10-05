import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Badge, Card, RatingBadge } from '@kinoox/design-system'
import { TitleActions } from '@/components/title/TitleActions'
import { CommentsSection } from '@/components/title/CommentsSection'
import { TitleSection } from '@/components/catalog/TitleSection'
import { api } from '@/lib/api'
import { siteConfig } from '@/lib/config'
import { formatDuration } from '@kinoox/design-system/utils'

export const revalidate = 600

const TYPE_LABELS: Record<string, string> = {
  movie: 'Фильм',
  serial: 'Сериал',
  cartoon: 'Мультфильм',
  anime: 'Аниме',
}

const STATUS_LABELS: Record<string, string> = {
  ongoing: 'Выходит',
  released: 'Завершён',
  announced: 'Анонс',
}

async function loadTitle(id: number) {
  try {
    return await api.titles.byId(id)
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const id = Number(params.id)
  if (!Number.isFinite(id)) return { title: 'Тайтл не найден' }

  const title = await loadTitle(id)
  if (!title) return { title: 'Тайтл не найден' }

  const description =
    title.description?.slice(0, 300) ??
    `${title.title} (${title.year}) — смотреть онлайн в KINOOX.`

  return {
    title: `${title.title} (${title.year})`,
    description,
    alternates: { canonical: `/title/${title.id}` },
    openGraph: {
      type: 'video.movie',
      title: `${title.title} (${title.year})`,
      description,
      images: [{ url: title.posterUrl, width: 500, height: 750, alt: title.title }],
      url: `${siteConfig.url}/title/${title.id}`,
    },
  }
}

export default async function TitlePage({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isFinite(id)) notFound()

  const title = await loadTitle(id)
  if (!title) notFound()

  const [related, similar] = await Promise.all([
    api.titles
      .related(id, 12)
      .then((result) => result.items)
      .catch(() => []),
    api.titles
      .similar(id, 12)
      .then((result) => result.items)
      .catch(() => []),
  ])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': title.type === 'movie' ? 'Movie' : 'TVSeries',
    name: title.title,
    alternateName: title.originalTitle ?? undefined,
    description: title.description ?? undefined,
    image: title.posterUrl,
    datePublished: String(title.year),
    genre: title.genres,
    countryOfOrigin: title.countries,
    aggregateRating:
      title.ratingKp && title.ratingKp > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: title.ratingKp,
            bestRating: 10,
            ratingCount: 1000,
          }
        : undefined,
  }

  return (
    <article className="pb-16">
      {/* Кинематографичная шапка с backdrop */}
      <div className="relative isolate">
        {title.backdropUrl ? (
          <div className="absolute inset-0 -z-10 h-[520px] overflow-hidden">
            <Image
              src={title.backdropUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[rgba(6,7,10,0.5)] via-[rgba(6,7,10,0.85)] to-void" />
          </div>
        ) : (
          <div className="kx-hero-bg absolute inset-0 -z-10 h-[520px]" aria-hidden="true" />
        )}

        <div className="kx-container pt-16">
          <div className="flex flex-col gap-10 lg:flex-row">
            {/* Постер */}
            <div className="mx-auto w-[220px] shrink-0 sm:w-[260px] lg:mx-0 lg:w-[300px]">
              <div className="relative aspect-[2/3] overflow-hidden rounded-[20px] shadow-[inset_0_0_0_1px_rgba(245,247,250,0.06),0_20px_48px_rgba(0,0,0,0.65)]">
                {title.posterUrl ? (
                  <Image
                    src={title.posterUrl}
                    alt={title.title}
                    fill
                    priority
                    sizes="300px"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-surface to-frost" />
                )}
              </div>
            </div>

            {/* Основная информация */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="flux" size="sm">
                  {TYPE_LABELS[title.type] ?? 'Тайтл'}
                </Badge>
                <Badge variant="outline" size="sm">
                  {STATUS_LABELS[title.status] ?? title.status}
                </Badge>
                {title.episodesCount && title.episodesCount > 0 ? (
                  <Badge variant="prism" size="sm">
                    {title.seasonsCount ?? 1} сезон · {title.episodesCount} серий
                  </Badge>
                ) : null}
              </div>

              <h1 className="mt-4 font-display text-[var(--text-h1)] font-bold leading-tight tracking-[-0.02em] text-text-primary">
                {title.title}
              </h1>

              {title.originalTitle ? (
                <p className="mt-2 font-mono text-[var(--text-small)] text-text-muted">
                  {title.originalTitle}
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <RatingBadge rating={title.ratingKp} size="lg" source="КП" />
                {title.ratingImdb ? (
                  <RatingBadge rating={title.ratingImdb} size="lg" source="IMDb" />
                ) : null}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[12px] text-text-secondary">
                  <span>{title.year}</span>
                  {title.duration ? <span>{formatDuration(title.duration)}</span> : null}
                  {title.countries.length > 0 ? <span>{title.countries.join(', ')}</span> : null}
                </div>
              </div>

              <div className="mt-6">
                <TitleActions title={title} />
              </div>

              {title.description ? (
                <p className="mt-8 max-w-3xl whitespace-pre-line text-[var(--text-body)] leading-relaxed text-text-secondary">
                  {title.description}
                </p>
              ) : null}

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {title.genres.length > 0 ? (
                  <Card padded>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                      Жанры
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {title.genres.map((genre) => (
                        <Badge key={genre} variant="outline" size="sm">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                ) : null}

                {title.directors.length > 0 ? (
                  <Card padded>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                      Режиссёры
                    </p>
                    <p className="mt-3 text-[var(--text-small)] text-text-secondary">
                      {title.directors.join(', ')}
                    </p>
                  </Card>
                ) : null}

                {title.actors.length > 0 ? (
                  <Card padded className="sm:col-span-2">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                      В ролях
                    </p>
                    <p className="mt-3 text-[var(--text-small)] text-text-secondary">
                      {title.actors.join(', ')}
                    </p>
                  </Card>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="kx-container">
        <TitleSection title="Похожее" items={related} />
        <TitleSection title="Сейчас смотрят" items={similar} />

        <CommentsSection titleId={title.id} />
      </div>

      <script
        type="application/ld+json"
        // Структурированные данные для поисковых систем
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </article>
  )
}