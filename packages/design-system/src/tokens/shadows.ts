/**
 * KINOOX — тени, свечения, стекло.
 */

export const shadows = {
  none: 'none',
  /** Лёгкий подъём карточки */
  sm: '0 2px 8px rgba(0, 0, 0, 0.4)',
  md: '0 8px 24px rgba(0, 0, 0, 0.5)',
  /** Карточка тайтла при наведении */
  lg: '0 20px 48px rgba(0, 0, 0, 0.65)',
  /** Модальные окна, плеер */
  xl: '0 32px 80px rgba(0, 0, 0, 0.75)',
  /** Внутреннее свечение по периметру карточки */
  innerRim: 'inset 0 0 0 1px rgba(245, 247, 250, 0.06)',
  innerRimStrong: 'inset 0 0 0 1px rgba(245, 247, 250, 0.12)',
  /** Свечение flux-prism за карточкой при наведении */
  cardHover:
    '0 20px 48px rgba(0, 0, 0, 0.65), 0 0 40px rgba(255, 61, 110, 0.18), 0 0 60px rgba(124, 92, 255, 0.14)',
} as const

export const glass = {
  /** Основной рецепт стекла: размытие 20px, насыщенность 1.5 */
  backdropFilter: 'blur(20px) saturate(1.5)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
  /** Шапка сайта, таб-бар мобильного приложения */
  background: 'rgba(12, 14, 20, 0.72)',
  backgroundStrong: 'rgba(12, 14, 20, 0.88)',
  backgroundLight: 'rgba(19, 22, 32, 0.6)',
  border: '1px solid rgba(28, 32, 48, 0.9)',
  borderLight: '1px solid rgba(245, 247, 250, 0.08)',
} as const

export const borders = {
  hairline: '1px solid #1C2030',
  divider: '1px solid rgba(28, 32, 48, 0.7)',
  accentFlux: '1px solid rgba(255, 61, 110, 0.45)',
  radiusCard: '20px',
} as const

export type ShadowName = keyof typeof shadows
