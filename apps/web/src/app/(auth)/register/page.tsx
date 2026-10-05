import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AuthForm } from '@/components/auth/AuthForm'

export const metadata: Metadata = {
  title: 'Регистрация',
  description: 'Создайте аккаунт KINOOX: закладки, история просмотра и уведомления о новых сериях.',
  alternates: { canonical: '/register' },
  robots: { index: false, follow: true },
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="kx-container py-24 text-center text-text-secondary">Загрузка…</div>}>
      <AuthForm mode="register" />
    </Suspense>
  )
}