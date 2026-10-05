import type { Metadata } from 'next'
import { ProfileScreen, RequireAuth } from '@/components/profile/Screens'

export const metadata: Metadata = {
  title: 'Профиль',
  description: 'Профиль пользователя KINOOX: настройки аккаунта и статистика.',
  robots: { index: false, follow: false },
}

export default function ProfilePage() {
  return (
    <RequireAuth title="Профиль">
      <ProfileScreen />
    </RequireAuth>
  )
}