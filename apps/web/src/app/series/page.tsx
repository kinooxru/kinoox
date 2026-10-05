import type { Metadata } from 'next'
import { CatalogPage } from '@/components/catalog/CatalogPage'

export const metadata: Metadata = {
  title: 'Сериалы',
  description:
    'Сериалы онлайн в KINOOX: новые сезоны, свежие серии и уведомления о выходах. Синхронизация прогресса между устройствами.',
  alternates: { canonical: '/series' },
}

export const revalidate = 300

export default function SeriesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  return (
    <CatalogPage
      searchParams={searchParams}
      type="serial"
      heading="Сериалы"
      description="Новые сезоны и свежие серии. Подпишитесь на сериал — сообщим о выходе новой серии."
    />
  )
}