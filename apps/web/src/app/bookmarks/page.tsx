import type { Metadata } from 'next'
import { BookmarksScreen, RequireAuth } from '@/components/profile/Screens'

export const metadata: Metadata = {
  title: 'Закладки',
  description: 'Ваши закладки в KINOOX: что смотрите, что в планах и что уже просмотрено.',
  robots: { index: false, follow: false },
}

export default function BookmarksPage() {
  return (
    <RequireAuth title="Закладки">
      <BookmarksScreen />
    </RequireAuth>
  )
}