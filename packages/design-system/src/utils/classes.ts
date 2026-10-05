/**
 * KINOOX — CSS-классы дизайн-системы.
 *
 * Набор атомарных классов, совпадающих по значениям с токенами.
 * Применяются там, где Tailwind недоступен или избыточен.
 */

export const classNames = {
  container: 'kx-container',
  glass: 'kx-glass',
  gradientText: 'kx-gradient-text',
  glowFlux: 'kx-glow-flux',
  glowPrism: 'kx-glow-prism',
  glowAura: 'kx-glow-aura',
  srOnly: 'kx-sr-only',
  skeleton: 'kx-skeleton',
  animScreenMorph: 'kx-anim-screen-morph',
  animPlayerEnter: 'kx-anim-player-enter',
  animHeartBurst: 'kx-anim-heart-burst',
  animLogoPulse: 'kx-anim-logo-pulse',
  animPlatformPulse: 'kx-anim-platform-pulse',
} as const

/** CSS-переменные для inline-стилей */
export const cssVars = {
  colorVoid: 'var(--color-void)',
  colorAbyss: 'var(--color-abyss)',
  colorSurface: 'var(--color-surface)',
  colorFrost: 'var(--color-frost)',
  colorFlux: 'var(--color-flux)',
  colorPrism: 'var(--color-prism)',
  colorAura: 'var(--color-aura)',
  gradientFlux: 'var(--gradient-flux)',
  gradientPrism: 'var(--gradient-prism)',
  gradientAura: 'var(--gradient-aura)',
  gradientFluxPrism: 'var(--gradient-flux-prism)',
  textPrimary: 'var(--color-text-primary)',
  textSecondary: 'var(--color-text-secondary)',
  textMuted: 'var(--color-text-muted)',
  glowFlux: 'var(--glow-flux)',
  glowPrism: 'var(--glow-prism)',
  glowAura: 'var(--glow-aura)',
  blurGlass: 'var(--blur-glass)',
  easeFlow: 'var(--ease-flow)',
} as const

/**
 * Цвет бейджа рейтинга: градиент flux при значении больше 7, серый — иначе.
 */
export function ratingTone(rating: number | null | undefined): {
  gradient: string | null
  background: string
  color: string
} {
  if (typeof rating === 'number' && rating > 7) {
    return {
      gradient: cssVars.gradientFlux,
      background: 'transparent',
      color: '#06070A',
    }
  }
  return {
    gradient: null,
    background: 'rgba(74, 80, 104, 0.45)',
    color: '#F5F7FA',
  }
}
