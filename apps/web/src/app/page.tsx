import type { Metadata } from 'next'
import { HeroBanner } from '@/components/home/HeroBanner'
import { TitleSection } from '@/components/catalog/TitleSection'
import { TitleGrid } from '@/components/catalog/TitleCard'
import { api } from '@/lib/api'
import { siteConfig } from '@/lib/config'
import type { SystemStatsDTO, TitleCardDTO } from '@kinoox/api-client'

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.slogan}`,
  description: siteConfig.description,
  alternates: { canonical: '/' },
}

/** Главная обновляется каждые 5 минут — ISR снижает нагрузку на SSR */
export const revalidate = 300

const EMPTY: TitleCardDTO[] = []

/** Подборки пересекаются — убираем повторы, иначе React ругается на одинаковые key */
function uniqueById(items: TitleCardDTO[]): TitleCardDTO[] {
  const seen = new Set<number>()
  return items.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

export default async function HomePage() {
  // Подборки главной и живая статистика; при недоступности API страница всё равно рендерится
  let collections: Awaited<ReturnType<typeof api.search.collections>> | null = null
  let stats: SystemStatsDTO | null = null

  try {
    const [colsRes, statsRes] = await Promise.allSettled([
      api.search.collections(),
      api.system.stats(),
    ])
    if (colsRes.status === 'fulfilled') collections = colsRes.value
    if (statsRes.status === 'fulfilled') stats = statsRes.value
  } catch {
    collections = null
    stats = null
  }

  const trending = collections?.trending.items ?? EMPTY
  const newReleases = collections?.newReleases.items ?? EMPTY
  const topRated = collections?.topRated.items ?? EMPTY
  const anime = collections?.anime.items ?? EMPTY

  const featured = trending[0]

  return (
    <>
      <HeroBanner featuredTitle={featured?.title} initialStats={stats} />

      <div className="kx-container pb-16">
        <TitleSection
          title="В тренде"
          subtitle="Что смотрят прямо сейчас"
          items={trending}
          href="/movies"
        />

        <TitleSection
          title="Новинки"
          subtitle="Только что появились в каталоге"
          items={newReleases}
          href="/series"
        />

        <TitleSection
          title="Высокий рейтинг"
          subtitle="Отбор по оценкам Кинопоиска"
          items={topRated}
          href="/movies?sort=rating"
        />

        <TitleSection title="Аниме" subtitle="Лучшее из мира аниме" items={anime} href="/anime" />

        {trending.length === 0 ? (
          <section className="py-16">
            <h2 className="font-display text-[var(--text-h2)] font-semibold">
              Каталог пока пуст
            </h2>
            <p className="mt-3 max-w-2xl text-text-secondary">
              Запустите API и наполните базу командой{' '}
              <code className="rounded bg-surface px-2 py-1 font-mono text-[var(--text-small)]">
                pnpm --filter @kinoox/api db:seed
              </code>{' '}
              — после этого на главной появятся подборки.
            </p>
          </section>
        ) : (
          <section className="py-10">
            <div className="mb-5 flex items-end justify-between gap-4">
              <h2 className="font-display text-[var(--text-h2)] font-semibold">
                Всё в одном месте
              </h2>
            </div>
            <TitleGrid titles={uniqueById([...trending, ...newReleases]).slice(0, 18)} />
          </section>
        )}
      </div>
    </>
  )
}