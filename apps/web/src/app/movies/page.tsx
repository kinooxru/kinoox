import type { Metadata } from 'next'
import { CatalogPage } from '@/components/catalog/CatalogPage'

export const metadata: Metadata = {
  title: 'Фильмы',
  description:
    'Фильмы онлайн в KINOOX: новинки проката, классика и культовое кино. Мгновенный плеер, закладки и история просмотра.',
  alternates: { canonical: '/movies' },
}

export const revalidate = 300

export default function MoviesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  return (
    <CatalogPage
      searchParams={searchParams}
      type="movie"
      heading="Фильмы"
      description="Новинки проката, классика и культовое кино — в высоком качестве и с мгновенным стартом плеера."
    />
  )
}