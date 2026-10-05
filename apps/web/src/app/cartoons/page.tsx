import type { Metadata } from 'next'
import { CatalogPage } from '@/components/catalog/CatalogPage'

export const metadata: Metadata = {
  title: 'Мультфильмы',
  description:
    'Мультфильмы онлайн в KINOOX: полнометражная анимация и мультсериалы для всей семьи.',
  alternates: { canonical: '/cartoons' },
}

export const revalidate = 300

export default function CartoonsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  return (
    <CatalogPage
      searchParams={searchParams}
      type="cartoon"
      heading="Мультфильмы"
      description="Полнометражная анимация и мультсериалы — для детей и взрослых."
    />
  )
}