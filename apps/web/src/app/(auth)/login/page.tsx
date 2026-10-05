import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AuthForm } from '@/components/auth/AuthForm'

export const metadata: Metadata = {
  title: 'Вход',
  description: 'Войдите в KINOOX — закладки, история и уведомления синхронизируются между устройствами.',
  alternates: { canonical: '/login' },
  robots: { index: false, follow: true },
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="kx-container py-24 text-center text-text-secondary">Загрузка…</div>}>
      <AuthForm mode="login" />
    </Suspense>
  )
}