import type { Metadata } from 'next'
import { siteConfig } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Условия использования',
  description: 'Условия использования сервиса KINOOX: правила работы с сайтом и приложениями.',
  alternates: { canonical: '/terms' },
}

const SECTIONS = [
  {
    title: '1. О сервисе',
    body: `KINOOX (${siteConfig.domain}) — онлайн-кинотеатр, предоставляющий доступ к каталогу фильмов, сериалов, мультфильмов и аниме. Видеоконтент воспроизводится через партнёрские балансеры Vibix и VeoVeo.`,
  },
  {
    title: '2. Аккаунт',
    body: 'Для синхронизации закладок, истории и уведомлений требуется аккаунт. Вы отвечаете за сохранность пароля. Один аккаунт предназначен для личного использования.',
  },
  {
    title: '3. Приложения',
    body: 'Приложения KINOOX распространяются напрямую: APK для Android, сборки TestFlight для iOS, установщики для Windows, macOS и Linux. Устанавливайте их только с официального домена kinoox.ru.',
  },
  {
    title: '4. Допустимое использование',
    body: 'Запрещены автоматизированный сбор данных, обход ограничений сервиса, распространение вредоносного кода и действия, нарушающие работу сервиса для других пользователей.',
  },
  {
    title: '5. Контент и права',
    body: `Материалы предоставляются партнёрами-правообладателями. Если вы считаете, что контент нарушает ваши права, напишите на rights@kinoox.ru — мы рассмотрим обращение в приоритетном порядке.`,
  },
  {
    title: '6. Изменения условий',
    body: 'Мы можем обновлять эти условия. Существенные изменения отражаются на этой странице с новой датой обновления.',
  },
]

export default function TermsPage() {
  return (
    <div className="kx-container py-16">
      <h1 className="font-display text-[var(--text-h1)] font-bold tracking-[-0.02em] text-text-primary">
        Условия использования
      </h1>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
        Обновлено: 1 октября 2026
      </p>

      <div className="mt-10 max-w-3xl space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="font-display text-[var(--text-h3)] font-semibold text-text-primary">
              {section.title}
            </h2>
            <p className="mt-3 text-[var(--text-body)] leading-relaxed text-text-secondary">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </div>
  )
}