import { KinooxLogo } from '@kinoox/design-system'

/** Экран загрузки: пульсирующий логотип KINOOX и слоган */
export default function Loading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6">
      <KinooxLogo size={64} pulse />
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted">
        Смотри. Чувствуй. Погружайся.
      </p>
    </div>
  )
}