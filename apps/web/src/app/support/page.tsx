import type { Metadata } from 'next'
import { Card, KinooxLogo } from '@kinoox/design-system'
import { siteConfig } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Поддержка',
  description: 'Поддержка KINOOX: ответы на частые вопросы, связь с командой и сроки ответа.',
  alternates: { canonical: '/support' },
}

const CONTACTS = [
  {
    title: 'Общие вопросы',
    email: siteConfig.supportEmail,
    note: 'Ответ в течение 24 часов',
  },
  {
    title: 'Правообладателям',
    email: 'rights@kinoox.ru',
    note: 'Запросы по контенту и удалению материалов',
  },
  {
    title: 'Технические проблемы',
    email: 'tech@kinoox.ru',
    note: 'Плеер, вход в аккаунт, приложения',
  },
]

export default function SupportPage() {
  return (
    <div className="kx-container py-16">
      <header className="mb-12 flex flex-col items-start gap-6">
        <KinooxLogo size={48} withWordmark />
        <div>
          <h1 className="font-display text-[var(--text-h1)] font-bold tracking-[-0.02em] text-text-primary">
            Поддержка KINOOX
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--text-body)] text-text-secondary">
            Мы отвечаем на обращения по почте. Перед письмом загляните в раздел частых вопросов
            на странице загрузки приложений — там собраны типовые ситуации.
          </p>
        </div>
      </header>

      <div className="grid gap-5 md:grid-cols-3">
        {CONTACTS.map((contact) => (
          <Card key={contact.email} variant="flat" padded>
            <h2 className="font-display text-[var(--text-h3)] font-semibold text-text-primary">
              {contact.title}
            </h2>
            <a
              href={`mailto:${contact.email}`}
              className="mt-3 block font-mono text-[var(--text-small)] text-flux-from underline-offset-4 hover:underline"
            >
              {contact.email}
            </a>
            <p className="mt-3 text-[var(--text-small)] text-text-secondary">{contact.note}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}