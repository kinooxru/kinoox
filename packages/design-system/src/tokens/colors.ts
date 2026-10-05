/**
 * KINOOX — дизайн-система «Cinematic Flow»
 *
 * Цветовая палитра. Все значения — точные из спецификации.
 */

/** Базовые поверхности: от самой глубокой к самой светлой */
export const surfaces = {
  /** Фон, глубже чёрного */
  void: '#06070A',
  /** Карточки, панели */
  abyss: '#0C0E14',
  /** Elevated-поверхности */
  surface: '#131620',
  /** Бордеры, разделители */
  frost: '#1C2030',
} as const

/**
 * Акценты — градиентные, не плоские.
 * Каждый акцент задан парой «от → к» и готовой CSS-строкой градиента.
 */
export const accents = {
  /** Основной: малина → коралл */
  flux: {
    from: '#FF3D6E',
    to: '#FF6B3D',
    gradient: 'linear-gradient(135deg, #FF3D6E 0%, #FF6B3D 100%)',
    gradientH: 'linear-gradient(90deg, #FF3D6E 0%, #FF6B3D 100%)',
  },
  /** Вторичный: фиолет → голубой */
  prism: {
    from: '#7C5CFF',
    to: '#5C8CFF',
    gradient: 'linear-gradient(135deg, #7C5CFF 0%, #5C8CFF 100%)',
    gradientH: 'linear-gradient(90deg, #7C5CFF 0%, #5C8CFF 100%)',
  },
  /** Третичный: мята → циан */
  aura: {
    from: '#00E5C7',
    to: '#00B8E5',
    gradient: 'linear-gradient(135deg, #00E5C7 0%, #00B8E5 100%)',
    gradientH: 'linear-gradient(90deg, #00E5C7 0%, #00B8E5 100%)',
  },
  /** Комбинированный flux → prism: прогресс-бар плеера, полоска активного таба */
  fluxPrism: {
    gradient: 'linear-gradient(90deg, #FF3D6E 0%, #7C5CFF 100%)',
  },
} as const

/** Текст */
export const text = {
  primary: '#F5F7FA',
  secondary: '#8B92A8',
  muted: '#4A5068',
} as const

/** Эффекты: свечения и стекло */
export const effects = {
  glowFlux: '0 0 40px rgba(255,61,110,0.3)',
  glowPrism: '0 0 40px rgba(124,92,255,0.25)',
  glowAura: '0 0 40px rgba(0,229,199,0.2)',
  glowFluxSoft: '0 0 24px rgba(255,61,110,0.18)',
  blurGlass: 'blur(20px) saturate(1.5)',
} as const

/** Семантические цвета состояний */
export const semantic = {
  success: '#00E5C7',
  warning: '#FFB020',
  danger: '#FF453A',
  info: '#5C8CFF',
  /** Рейтинг ниже 7 — серый бейдж */
  ratingLow: '#8B92A8',
} as const

/** Полная палитра одним объектом */
export const colors = {
  surfaces,
  accents,
  text,
  effects,
  semantic,
  /** Прозрачные слои поверх контента */
  overlay: {
    scrim: 'rgba(6, 7, 10, 0.72)',
    scrimStrong: 'rgba(6, 7, 10, 0.92)',
    veil: 'linear-gradient(180deg, rgba(6,7,10,0) 0%, rgba(6,7,10,0.85) 60%, #06070A 100%)',
    frostLine: 'rgba(28, 32, 48, 0.9)',
  },
} as const

export type ColorToken = typeof colors
export type AccentName = keyof typeof accents
export type SurfaceName = keyof typeof surfaces
