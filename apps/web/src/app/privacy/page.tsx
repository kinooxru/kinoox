import type { Metadata } from 'next'
import { siteConfig } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Политика конфиденциальности',
  description: 'Политика конфиденциальности KINOOX: какие данные мы собираем и как их используем.',
  alternates: { canonical: '/privacy' },
}

const SECTIONS = [
  {
    title: '1. Какие данные мы собираем',
    body: 'Адрес электронной почты, имя пользователя и хэш пароля при регистрации. Данные о просмотрах: какие тайтлы вы открывали, сезон и серию, время просмотра. Технические данные: тип устройства, версия приложения, IP-адрес.',
  },
  {
    title: '2. Зачем мы их используем',
    body: 'Чтобы синхронизировать закладки и историю между вашими устройствами, продолжать просмотр с того же места, отправлять уведомления о новых сериях и обеспечивать работу сервиса.',
  },
  {
    title: '3. Передача третьим лицам',
    body: 'Мы не продаём персональные данные. Запросы к балансерам видео выполняются с серверов KINOOX и не содержат ваших персональных данных. Пуш-уведомления доставляются через Firebase Cloud Messaging (Android) и APNs (iOS).',
  },
  {
    title: '4. Хранение и защита',
    body: 'Пароли хранятся только в виде хэша bcrypt. Доступ к базе данных ограничен, соединения защищены TLS. Резервные копии создаются ежедневно и хранятся 30 дней.',
  },
  {
    title: '5. Ваши права',
    body: `Вы можете изменить имя пользователя в профиле, очистить историю просмотра, удалить закладки и запросить удаление аккаунта письмом на ${siteConfig.supportEmail}.`,
  },
  {
    title: '6. Cookies и локальное хранилище',
    body: 'Мы используем localStorage браузера для хранения токенов авторизации. PWA-манифест и service worker не используются: сайт остаётся сайтом.',
  },
]

export default function PrivacyPage() {
  return (
    <div className="kx-container py-16">
      <h1 className="font-display text-[var(--text-h1)] font-bold tracking-[-0.02em] text-text-primary">
        Политика конфиденциальности
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