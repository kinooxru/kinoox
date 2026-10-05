import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { WatchScreen } from '@/components/player/WatchScreen'
import { api } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const id = Number(params.id)
  if (!Number.isFinite(id)) return { title: 'Просмотр' }

  try {
    const title = await api.titles.byId(id)
    return {
      title: `Смотреть «${title.title}»`,
      description: title.description?.slice(0, 200) ?? undefined,
      robots: { index: false, follow: true },
    }
  } catch {
    return { title: 'Просмотр' }
  }
}

/**
 * Страница просмотра: плеер открыт сразу, без лишних кликов.
 * Ссылка на неё ведёт кнопка «Смотреть» на странице тайтла.
 */
export default async function WatchPage({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isFinite(id)) notFound()

  const [title, sources, episodes] = await Promise.all([
    api.titles.byId(id).catch(() => null),
    api.titles
      .sources(id)
      .then((result) => result.sources)
      .catch(() => []),
    api.titles
      .episodes(id)
      .catch(() => []),
  ])

  if (!title) notFound()

  return <WatchScreen title={title} sources={sources} episodes={episodes} />
}