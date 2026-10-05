/**
 * KINOOX — отступы, радиусы, breakpoints, z-index.
 */

/** Шаг сетки — 4px */
export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  32: '8rem',
} as const

/**
 * Радиусы. Карточки тайтлов — 20px по спецификации.
 */
export const radii = {
  none: '0',
  sm: '8px',
  md: '12px',
  lg: '16px',
  /** Карточки тайтлов */
  card: '20px',
  /** Панели, hero-блоки */
  panel: '28px',
  pill: '9999px',
  full: '50%',
} as const

export const breakpoints = {
  xs: 360,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
} as const

export const mediaQueries = {
  xs: `@media (min-width: ${breakpoints.xs}px)`,
  sm: `@media (min-width: ${breakpoints.sm}px)`,
  md: `@media (min-width: ${breakpoints.md}px)`,
  lg: `@media (min-width: ${breakpoints.lg}px)`,
  xl: `@media (min-width: ${breakpoints.xl}px)`,
  xxl: `@media (min-width: ${breakpoints.xxl}px)`,
  /** Мобильные устройства */
  mobile: `@media (max-width: ${breakpoints.md - 1}px)`,
  /** Пользователь просил меньше движения */
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
} as const

export const zIndex = {
  base: 0,
  raised: 10,
  header: 100,
  dropdown: 200,
  overlay: 300,
  modal: 400,
  player: 500,
  toast: 600,
  tooltip: 700,
} as const

/** Контейнер контента */
export const layout = {
  containerMaxWidth: '1440px',
  containerPadding: 'clamp(1rem, 4vw, 4rem)',
  headerHeight: '72px',
  mobileTabBarHeight: '64px',
  /** Ширина постера карточки в сетках */
  posterAspect: '2 / 3',
  backdropAspect: '16 / 9',
} as const
