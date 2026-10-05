'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Badge, Button, KinooxLogo } from '@kinoox/design-system'
import { catalogSections } from '@/lib/config'
import { useAuth } from '@/components/providers/AuthProvider'
import { SearchOverlay } from './SearchOverlay'
import { NotificationsBell } from './NotificationsBell'

/**
 * Шапка сайта со smart-hide: прячется при скролле вниз,
 * выезжает при скролле вверх. Стекло + expandable-поиск.
 */
export function SiteHeader() {
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuth()

  const [hidden, setHidden] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const lastScrollY = React.useRef(0)

  // Smart-hide при скролле
  React.useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY
      setScrolled(currentY > 12)
      // Прячем только если прокрутили достаточно и двигаемся вниз
      if (currentY > 120 && currentY > lastScrollY.current + 4) setHidden(true)
      else if (currentY < lastScrollY.current - 4) setHidden(false)
      lastScrollY.current = currentY
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Закрываем мобильное меню при смене страницы
  React.useEffect(() => {
    setMobileMenuOpen(false)
    setSearchOpen(false)
  }, [pathname])

  // Ctrl+K и «/» открывают поиск
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isTyping =
        event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      } else if (event.key === '/' && !isTyping) {
        event.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <>
      <motion.header
        initial={false}
        animate={{ y: hidden ? '-100%' : '0%' }}
        transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
        className={[
          'fixed inset-x-0 top-0 z-[100] h-[72px]',
          'transition-[background-color,border-color,box-shadow] duration-300',
          scrolled
            ? 'border-b border-frost bg-[rgba(6,7,10,0.82)] backdrop-blur-[20px] backdrop-saturate-150'
            : 'border-b border-transparent bg-transparent',
        ].join(' ')}
      >
        <div className="kx-container flex h-full items-center gap-4">
          <Link href="/" aria-label="KINOOX — на главную" className="shrink-0">
            <KinooxLogo size={34} withWordmark />
          </Link>

          <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Разделы каталога">
            {catalogSections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className={[
                  'relative rounded-full px-4 py-2 text-[var(--text-small)] font-medium transition-colors duration-200',
                  isActive(section.href)
                    ? 'text-text-primary'
                    : 'text-text-secondary hover:text-text-primary',
                ].join(' ')}
              >
                {section.label}
                {isActive(section.href) ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-gradient-flux-prism"
                  />
                ) : null}
              </Link>
            ))}
            <Link
              href="/download"
              className="ml-1 flex items-center gap-2 rounded-full px-4 py-2 text-[var(--text-small)] font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              Приложения
              <Badge variant="aura" size="sm" dot>
                новое
              </Badge>
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Открыть поиск"
              className="flex h-10 items-center gap-2 rounded-full border border-frost bg-[rgba(12,14,20,0.6)] px-4 text-text-secondary transition-colors hover:border-[rgba(255,61,110,0.45)] hover:text-text-primary"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <path d="M11 11l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <span className="hidden text-[var(--text-small)] xl:inline">Поиск</span>
              <kbd className="hidden rounded border border-frost px-1.5 py-0.5 font-mono text-[10px] text-text-muted xl:inline">
                Ctrl K
              </kbd>
            </button>

            {isAuthenticated ? (
              <>
                <NotificationsBell />
                <Link
                  href="/profile"
                  className="flex h-10 items-center gap-2 rounded-full border border-frost bg-[rgba(12,14,20,0.6)] pl-1 pr-4 transition-colors hover:border-[rgba(255,61,110,0.45)]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-flux text-[13px] font-semibold text-void">
                    {user?.username.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden text-[var(--text-small)] font-medium text-text-primary sm:inline">
                    {user?.username}
                  </span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm">
                    Войти
                  </Button>
                </Link>
                <Link href="/register" className="hidden sm:block">
                  <Button variant="flux" size="sm">
                    Регистрация
                  </Button>
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((value) => !value)}
              aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={mobileMenuOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-frost text-text-secondary lg:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                {mobileMenuOpen ? (
                  <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                ) : (
                  <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Мобильное меню */}
      <AnimatePresence>
        {mobileMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 top-[72px] z-[99] border-b border-frost bg-[rgba(6,7,10,0.96)] backdrop-blur-[20px] lg:hidden"
          >
            <nav className="kx-container flex flex-col gap-1 py-4" aria-label="Мобильное меню">
              {catalogSections.map((section) => (
                <Link
                  key={section.href}
                  href={section.href}
                  className="rounded-xl px-4 py-3 text-[var(--text-body)] font-medium text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
                >
                  {section.label}
                </Link>
              ))}
              <Link
                href="/download"
                className="rounded-xl px-4 py-3 text-[var(--text-body)] font-medium text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
              >
                Приложения
              </Link>
              <div className="kx-divider my-2" />
              {isAuthenticated ? (
                <>
                  <Link
                    href="/profile"
                    className="rounded-xl px-4 py-3 text-[var(--text-body)] font-medium text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
                  >
                    Профиль
                  </Link>
                  <Link
                    href="/bookmarks"
                    className="rounded-xl px-4 py-3 text-[var(--text-body)] font-medium text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
                  >
                    Закладки
                  </Link>
                  <Link
                    href="/history"
                    className="rounded-xl px-4 py-3 text-[var(--text-body)] font-medium text-text-secondary transition-colors hover:bg-surface hover:text-text-primary"
                  >
                    История
                  </Link>
                </>
              ) : (
                <div className="flex gap-2 px-4 py-2">
                  <Link href="/login" className="flex-1">
                    <Button variant="outline" size="md" fullWidth>
                      Войти
                    </Button>
                  </Link>
                  <Link href="/register" className="flex-1">
                    <Button variant="flux" size="md" fullWidth>
                      Регистрация
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}