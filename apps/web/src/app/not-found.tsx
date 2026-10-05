import Link from 'next/link'
import { KinooxLogo } from '@kinoox/design-system'

export default function NotFound() {
  return (
    <div className="kx-container flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
      <KinooxLogo size={64} />
      <p className="mt-8 font-display text-[var(--text-hero)] font-bold leading-none text-text-primary">
        404
      </p>
      <h1 className="mt-4 font-display text-[var(--text-h2)] font-semibold text-text-primary">
        Страница не найдена
      </h1>
      <p className="mt-3 max-w-md text-[var(--text-small)] text-text-secondary">
        Возможно, ссылка устарела или тайтл удалён из каталога. Попробуйте начать с главной
        или найти нужное через поиск.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-12 items-center rounded-full bg-gradient-flux px-7 font-semibold text-void transition-[box-shadow,filter] hover:shadow-glow-flux hover:brightness-110"
        >
          На главную
        </Link>
        <Link
          href="/movies"
          className="inline-flex h-12 items-center rounded-full border border-frost px-7 text-text-primary transition-colors hover:border-[rgba(255,61,110,0.45)]"
        >
          В каталог
        </Link>
      </div>
    </div>
  )
}