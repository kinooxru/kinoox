import Link from 'next/link'
import { Badge, KinooxLogo } from '@kinoox/design-system'
import { catalogSections, siteConfig } from '@/lib/config'

const YEAR = new Date().getFullYear()

/** Подвал сайта: навигация, документы, бренд. */
export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-frost bg-abyss">
      <div className="kx-container py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <KinooxLogo size={40} withWordmark />
            <p className="mt-4 max-w-xs text-[var(--text-small)] text-text-secondary">
              {siteConfig.slogan}
            </p>
            <p className="mt-4 text-[var(--text-small)] text-text-muted">
              Онлайн-кинотеатр нового поколения. Нативные приложения для всех платформ —
              без PWA и веб-обёрток.
            </p>
          </div>

          <nav aria-label="Каталог">
            <h2 className="mb-4 font-display text-[var(--text-small)] font-semibold uppercase tracking-[0.12em] text-text-muted">
              Каталог
            </h2>
            <ul className="space-y-2.5">
              {catalogSections.map((section) => (
                <li key={section.href}>
                  <Link
                    href={section.href}
                    className="text-[var(--text-small)] text-text-secondary transition-colors hover:text-text-primary"
                  >
                    {section.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/search"
                  className="text-[var(--text-small)] text-text-secondary transition-colors hover:text-text-primary"
                >
                  Поиск
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Приложения">
            <h2 className="mb-4 font-display text-[var(--text-small)] font-semibold uppercase tracking-[0.12em] text-text-muted">
              Приложения
            </h2>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/download"
                  className="flex items-center gap-2 text-[var(--text-small)] text-text-secondary transition-colors hover:text-text-primary"
                >
                  Все платформы
                  <Badge variant="aura" size="sm">
                    5
                  </Badge>
                </Link>
              </li>
              <li>
                <Link
                  href="/download#android"
                  className="text-[var(--text-small)] text-text-secondary transition-colors hover:text-text-primary"
                >
                  Android — APK
                </Link>
              </li>
              <li>
                <Link
                  href="/download#ios"
                  className="text-[var(--text-small)] text-text-secondary transition-colors hover:text-text-primary"
                >
                  iOS — TestFlight
                </Link>
              </li>
              <li>
                <Link
                  href="/download#windows"
                  className="text-[var(--text-small)] text-text-secondary transition-colors hover:text-text-primary"
                >
                  Windows — .exe / .msi
                </Link>
              </li>
              <li>
                <Link
                  href="/download#linux"
                  className="text-[var(--text-small)] text-text-secondary transition-colors hover:text-text-primary"
                >
                  Linux — AppImage / .deb / .rpm
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Документы">
            <h2 className="mb-4 font-display text-[var(--text-small)] font-semibold uppercase tracking-[0.12em] text-text-muted">
              Помощь
            </h2>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/support"
                  className="text-[var(--text-small)] text-text-secondary transition-colors hover:text-text-primary"
                >
                  Поддержка
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-[var(--text-small)] text-text-secondary transition-colors hover:text-text-primary"
                >
                  Политика конфиденциальности
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-[var(--text-small)] text-text-secondary transition-colors hover:text-text-primary"
                >
                  Условия использования
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${siteConfig.supportEmail}`}
                  className="text-[var(--text-small)] text-text-secondary transition-colors hover:text-text-primary"
                >
                  {siteConfig.supportEmail}
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="kx-divider my-10" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] text-text-muted">
            © {YEAR} KINOOX · {siteConfig.domain}
          </p>
          <p className="text-[11px] text-text-muted">
            Все материалы предоставлены партнёрами-правообладателями.
          </p>
        </div>
      </div>
    </footer>
  )
}