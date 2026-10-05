/**
 * Конфигурация сайта. Читается из переменных окружения Next.js.
 */
export const siteConfig = {
  name: 'KINOOX',
  domain: 'kinoox.ru',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kinoox.ru',
  slogan: 'Смотри. Чувствуй. Погружайся.',
  description:
    'KINOOX — онлайн-кинотеатр нового поколения: фильмы, сериалы, мультфильмы и аниме. Нативные приложения для Android, iOS, Windows, macOS и Linux.',
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1',
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001',
  email: 'noreply@kinoox.ru',
  supportEmail: 'support@kinoox.ru',
} as const

/** Основные разделы каталога */
export const catalogSections = [
  { href: '/movies', label: 'Фильмы', type: 'movie' as const },
  { href: '/series', label: 'Сериалы', type: 'serial' as const },
  { href: '/cartoons', label: 'Мультфильмы', type: 'cartoon' as const },
  { href: '/anime', label: 'Аниме', type: 'anime' as const },
] as const

/** Пункты меню профиля */
export const profileNav = [
  { href: '/profile', label: 'Профиль' },
  { href: '/bookmarks', label: 'Закладки' },
  { href: '/history', label: 'История' },
] as const
