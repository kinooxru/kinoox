'use client'

import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Badge } from '@kinoox/design-system'
import type { ChangelogEntry } from '@kinoox/api-client'

const PLATFORM_LABELS: Record<string, string> = {
  android: 'Android',
  ios: 'iOS',
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
}

/**
 * ChangelogSection — история версий.
 * Последняя версия раскрыта, остальные сворачиваются аккордеоном.
 * Данные приходят из /api/v1/downloads/changelog.
 */
export function ChangelogSection({ entries }: { entries: ChangelogEntry[] }) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0)

  if (entries.length === 0) return null

  return (
    <section className="kx-container py-16">
      <header className="mb-8">
        <h2 className="font-display text-[var(--text-h2)] font-semibold tracking-[-0.02em] text-text-primary">
          История версий
        </h2>
        <p className="mt-2 text-[var(--text-small)] text-text-secondary">
          Что менялось в приложениях KINOOX — от релиза к релизу.
        </p>
      </header>

      <div className="space-y-3">
        {entries.map((entry, index) => {
          const isOpen = openIndex === index
          return (
            <article
              key={`${entry.platform}-${entry.version}-${entry.releaseDate}`}
              className={[
                'overflow-hidden rounded-[20px] border transition-colors duration-300',
                isOpen ? 'border-[rgba(255,61,110,0.35)] bg-abyss' : 'border-frost bg-abyss',
              ].join(' ')}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-4 px-6 py-5 text-left"
              >
                <span className="flex items-baseline gap-2">
                  <span className="font-display text-[var(--text-h3)] font-semibold text-text-primary">
                    v{entry.version}
                  </span>
                  {index === 0 ? (
                    <Badge variant="flux" size="sm">
                      Актуальная
                    </Badge>
                  ) : null}
                </span>

                <span className="ml-auto flex items-center gap-4">
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-muted">
                    {PLATFORM_LABELS[entry.platform] ?? entry.platform}
                  </span>
                  <span className="font-mono text-[11px] text-text-muted">
                    {new Date(entry.releaseDate).toLocaleDateString('ru-RU', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                    className="text-text-secondary"
                    aria-hidden="true"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16">
                      <path
                        d="M4 6l4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </motion.span>
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <ul className="space-y-2.5 border-t border-frost px-6 py-5">
                      {entry.changes.map((change) => (
                        <li key={change} className="flex gap-3 text-[var(--text-small)] text-text-secondary">
                          <span
                            aria-hidden="true"
                            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-flux"
                          />
                          {change}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </article>
          )
        })}
      </div>
    </section>
  )
}

/** FAQSection — аккордеон с вопросами об установке и отличиях от PWA */
const FAQ_ITEMS: Array<{ question: string; answer: string }> = [
  {
    question: 'Как установить APK на Android?',
    answer:
      'Скачайте файл kinoox-1.0.0.apk по кнопке «Скачать APK» и откройте его. Android попросит разрешить установку из этого источника — включите разрешение для браузера или файлового менеджера и подтвердите установку. После установки приложение появится в списке приложений с иконкой KINOOX.',
  },
  {
    question: 'Как установить через TestFlight на iOS?',
    answer:
      'Нажмите «Установить через TestFlight». Откроется приложение TestFlight (установите его из App Store, если ещё нет), где нужно принять приглашение и нажать «Установить». Сборка действует 90 дней, после чего мы публикуем новую.',
  },
  {
    question: 'Чем отличается от PWA?',
    answer:
      'KINOOX — это полноценные нативные приложения, а не веб-обёртка. Они работают быстрее, поддерживают офлайн-режим, push-уведомления, системный трей и нативные жесты.',
  },
  {
    question: 'Нужна ли подписка?',
    answer:
      'Каталог, закладки, история и плеер доступны без подписки. Аккаунт нужен для синхронизации закладок между устройствами и уведомлений о новых сериях.',
  },
  {
    question: 'Какие источники видео используются?',
    answer:
      'Плеер работает с балансерами Vibix и Veoveo. Приложение запрашивает оба источника и открывает тот, который отвечает первым, — переключиться можно в один тап прямо в плеере.',
  },
  {
    question: 'Как синхронизировать закладки между устройствами?',
    answer:
      'Войдите в один и тот же аккаунт KINOOX на всех устройствах. Закладки, история просмотра и прогресс сериалов хранятся на сервере и подтягиваются автоматически при каждом открытии приложения.',
  },
  {
    question: 'Будет ли в Google Play / App Store?',
    answer:
      'Сейчас приложения распространяются напрямую: APK для Android и TestFlight для iOS. Это позволяет выпускать обновления без модерации магазинов. Публикация в Google Play и App Store запланирована.',
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0)

  return (
    <section className="kx-container py-16">
      <header className="mb-8">
        <h2 className="font-display text-[var(--text-h2)] font-semibold tracking-[-0.02em] text-text-primary">
          Частые вопросы
        </h2>
        <p className="mt-2 text-[var(--text-small)] text-text-secondary">
          Установка, источники видео и синхронизация между устройствами.
        </p>
      </header>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index
          return (
            <article
              key={item.question}
              className="overflow-hidden rounded-[20px] border border-frost bg-abyss"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-4 px-6 py-5 text-left"
              >
                <span className="font-display text-[var(--text-body)] font-medium text-text-primary">
                  {item.question}
                </span>
                <motion.span
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  className="ml-auto shrink-0 text-prism-from"
                  aria-hidden="true"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path
                      d="M9 3v12M3 9h12"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="border-t border-frost px-6 py-5 text-[var(--text-small)] leading-relaxed text-text-secondary">
                      {item.answer}
                    </p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </article>
          )
        })}
      </div>
    </section>
  )
}

/** Подвал страницы загрузки: CTA на главную + документы */
export function DownloadFooterCTA() {
  return (
    <section className="kx-container py-16">
      <div className="relative overflow-hidden rounded-[28px] border border-frost bg-abyss px-8 py-14 text-center">
        <div className="kx-hero-bg absolute inset-0 -z-10" aria-hidden="true" />

        <h2 className="font-display text-[var(--text-h1)] font-bold tracking-[-0.02em] text-text-primary">
          Готовы начать? Откройте KINOOX в браузере
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[var(--text-body)] text-text-secondary">
          Каталог доступен сразу, без установки. Приложения добавят офлайн-каталог, уведомления
          и системную интеграцию.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href="/">
            <span className="inline-flex h-14 items-center rounded-full bg-gradient-flux px-8 font-semibold text-void transition-[box-shadow,filter] duration-200 hover:shadow-glow-flux hover:brightness-110">
              На главную
            </span>
          </a>
          <a href="/movies">
            <span className="inline-flex h-14 items-center rounded-full border border-frost bg-[rgba(12,14,20,0.6)] px-8 text-text-primary transition-colors hover:border-[rgba(255,61,110,0.45)]">
              Открыть каталог
            </span>
          </a>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-[var(--text-small)]">
          <a href="/support" className="text-text-secondary transition-colors hover:text-text-primary">
            Поддержка
          </a>
          <a href="/privacy" className="text-text-secondary transition-colors hover:text-text-primary">
            Политика конфиденциальности
          </a>
          <a href="/terms" className="text-text-secondary transition-colors hover:text-text-primary">
            Условия использования
          </a>
        </div>
      </div>
    </section>
  )
}