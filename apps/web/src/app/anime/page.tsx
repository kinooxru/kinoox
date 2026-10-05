import type { Metadata } from 'next'
import { CatalogPage } from '@/components/catalog/CatalogPage'

export const metadata: Metadata = {
  title: 'Аниме',
  description:
    'Аниме онлайн в KINOOX: онгоинги, классика и полнометражные фильмы. Озвучки и субтитры, уведомления о новых сериях.',
  alternates: { canonical: '/anime' },
}

export const revalidate = 300

export default function AnimePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  return (
    <CatalogPage
      searchParams={searchParams}
      type="anime"
      heading="Аниме"
      description="Онгоинги, классика и полнометражные фильмы. Новые серии появляются в день выхода."
    />
  )
}