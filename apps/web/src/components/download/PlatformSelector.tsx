'use client'

import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Badge, Button } from '@kinoox/design-system'
import type { DownloadPlatformDTO } from '@kinoox/api-client'
import { PLATFORMS, PlatformIcon } from './DownloadHero'

export interface PlatformSelectorProps {
  platforms: DownloadPlatformDTO[]
}

/**
 * PlatformSelector — 5 табов с morph-анимацией: контент перетекает,
 * а не меняется резко. Каждый таб содержит описание, кнопки скачивания,
 * QR-код (для мобильных), размер, версию, системные требования и особенности.
 */
export function PlatformSelector({ platforms }: PlatformSelectorProps) {
  const [active, setActive] = React.useState<string>(platforms[0]?.platform ?? 'android')

  const current = platforms.find((item) => item.platform === active) ?? platforms[0]
  if (!current) return null

  return (
    <section id="platforms" className="kx-container py-16">
      <header className="mb-8">
        <h2 className="font-display text-[var(--text-h2)] font-semibold tracking-[-0.02em] text-text-primary">
          Выберите платформу
        </h2>
        <p className="mt-2 text-[var(--text-small)] text-text-secondary">
          Каждое приложение — полноценный клиент с собственным интерфейсом и системной интеграцией.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Платформы"
        className="mb-8 flex flex-wrap gap-2 border-b border-frost pb-4"
      >
        {PLATFORMS.map((platform) => {
          const isActive = platform.id === active
          return (
            <button
              key={platform.id}
              type="button"
              role="tab"
              id={`tab-${platform.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${platform.id}`}
              onClick={() => setActive(platform.id)}
              className={[
                'relative flex items-center gap-2.5 rounded-full px-5 py-2.5 text-[var(--text-small)] font-medium transition-colors',
                isActive
                  ? 'bg-surface text-text-primary'
                  : 'text-text-secondary hover:bg-abyss hover:text-text-primary',
              ].join(' ')}
            >
              <PlatformIcon platform={platform.id} size={20} />
              {platform.label}
              {isActive ? (
                <motion.span
                  layoutId="platform-underline"
                  className="absolute inset-x-4 -bottom-[17px] h-[2px] rounded-full bg-gradient-flux-prism"
                />
              ) : null}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.platform}
          id={`panel-${current.platform}`}
          role="tabpanel"
          aria-labelledby={`tab-${current.platform}`}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="grid gap-8 lg:grid-cols-[1.4fr_1fr]"
        >
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-frost bg-abyss text-flux-from">
                <PlatformIcon platform={current.platform} size={26} />
              </span>
              <div>
                <h3 className="font-display text-[var(--text-h3)] font-semibold text-text-primary">
                  KINOOX для {current.title}
                </h3>
                <p className="font-mono text-[11px] text-text-muted">
                  Версия {current.version} · {current.size} · {current.minimumOs}
                </p>
              </div>
            </div>

            <p className="mt-6 max-w-2xl text-[var(--text-body)] leading-relaxed text-text-secondary">
              {current.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {current.downloads.map((download) => (
                <a key={download.label} href={download.url} download>
                  <Button variant="flux" size="lg">
                    {download.label}
                  </Button>
                </a>
              ))}
            </div>

            <div className="mt-8">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                Особенности
              </p>
              <div className="flex flex-wrap gap-2">
                {current.features.map((feature) => (
                  <Badge key={feature} variant="aura" size="sm">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <aside className="flex flex-col gap-6">
            {current.qrCodeUrl ? (
              <div className="rounded-[20px] border border-frost bg-abyss p-6 text-center">
                <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                  Наведите камеру телефона
                </p>
                {/* QR-код отдаёт API: /api/qr?data=<ссылка> */}
                <img
                  src={current.qrCodeUrl}
                  alt={`QR-код для скачивания KINOOX на ${current.title}`}
                  width={200}
                  height={200}
                  className="mx-auto rounded-xl bg-text-primary p-2"
                  loading="lazy"
                />
                <p className="mt-4 text-[var(--text-small)] text-text-secondary">
                  Откроется страница загрузки {current.title}
                </p>
              </div>
            ) : null}

            <div className="rounded-[20px] border border-frost bg-abyss p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                Системные требования
              </p>
              <dl className="mt-4 space-y-3 text-[var(--text-small)]">
                <div className="flex justify-between gap-4">
                  <dt className="text-text-secondary">Платформа</dt>
                  <dd className="text-text-primary">{current.title}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-secondary">Минимальная ОС</dt>
                  <dd className="text-right text-text-primary">{current.minimumOs}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-secondary">Размер</dt>
                  <dd className="font-mono text-text-primary">{current.size}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-secondary">Версия</dt>
                  <dd className="font-mono text-text-primary">{current.version}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-text-secondary">Интернет</dt>
                  <dd className="text-text-primary">от 5 Мбит/с</dd>
                </div>
              </dl>
            </div>
          </aside>
        </motion.div>
      </AnimatePresence>
    </section>
  )
}