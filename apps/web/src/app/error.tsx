'use client'

import { KinooxLogo } from '@kinoox/design-system'

/** Глобальный экран ошибки: пульсирующий логотип и кнопка повтора */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="kx-container flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
      <KinooxLogo size={64} pulse />
      <h1 className="mt-8 font-display text-[var(--text-h2)] font-semibold text-text-primary">
        Что-то пошло не так
      </h1>
      <p className="mt-3 max-w-md text-[var(--text-small)] text-text-secondary">
        Мы уже получили сигнал об ошибке. Попробуйте обновить страницу — обычно этого достаточно.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-[10px] text-text-muted">Код ошибки: {error.digest}</p>
      ) : null}

      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex h-12 items-center rounded-full bg-gradient-flux px-7 font-semibold text-void transition-[box-shadow,filter] hover:shadow-glow-flux hover:brightness-110"
      >
        Попробовать снова
      </button>
    </div>
  )
}