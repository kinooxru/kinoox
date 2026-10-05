import type { Metadata } from 'next'
import { HistoryScreen, RequireAuth } from '@/components/profile/Screens'

export const metadata: Metadata = {
  title: 'История просмотра',
  description: 'История просмотра в KINOOX: продолжите с того места, где остановились.',
  robots: { index: false, follow: false },
}

export default function HistoryPage() {
  return (
    <RequireAuth title="История просмотра">
      <HistoryScreen />
    </RequireAuth>
  )
}