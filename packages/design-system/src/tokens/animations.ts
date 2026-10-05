/**
 * KINOOX — анимации «Cinematic Flow».
 *
 * Ключевая кривая всего интерфейса: cubic-bezier(0.16, 1, 0.3, 1).
 */

/** Основной easing проекта — «выход с торможением» */
export const EASE_FLOW = 'cubic-bezier(0.16, 1, 0.3, 1)'
export const EASE_FLOW_IN = 'cubic-bezier(0.7, 0, 0.84, 0)'
export const EASE_SOFT = 'cubic-bezier(0.4, 0, 0.2, 1)'
export const EASE_SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'

/** Длительности в миллисекундах и в CSS-виде */
export const durations = {
  instant: 100,
  fast: 180,
  /** Переход между экранами: 400ms */
  screen: 400,
  base: 260,
  slow: 600,
  /** Контролы плеера скрываются через 3 секунды бездействия */
  playerControlsIdle: 3000,
} as const

export const cssDurations = {
  instant: '100ms',
  fast: '180ms',
  screen: '400ms',
  base: '260ms',
  slow: '600ms',
} as const

export const easings = {
  flow: EASE_FLOW,
  flowIn: EASE_FLOW_IN,
  soft: EASE_SOFT,
  spring: EASE_SPRING,
} as const

/**
 * Именованные анимации. Значения совпадают с keyframes в theme.css
 * и используются в motion-обёртках Framer Motion.
 */
export const animations = {
  /** Плеер выезжает снизу */
  playerEnter: {
    from: { opacity: 0, transform: 'translateY(100%)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    duration: durations.screen,
    ease: EASE_FLOW,
  },
  /** Экраны: снизу + scale(0.95 → 1) */
  screenMorph: {
    from: { opacity: 0, transform: 'translateY(24px) scale(0.95)' },
    to: { opacity: 1, transform: 'translateY(0) scale(1)' },
    duration: durations.screen,
    ease: EASE_FLOW,
  },
  /** Шапка: smart-hide при скролле вниз */
  headerHide: {
    hidden: { transform: 'translateY(-100%)' },
    visible: { transform: 'translateY(0)' },
    duration: durations.base,
    ease: EASE_FLOW,
  },
  /** Скелетон: пробегающий блик */
  shimmer: {
    background: 'linear-gradient(90deg, #131620 0%, #1C2030 50%, #131620 100%)',
    backgroundSize: '200% 100%',
    duration: 1400,
  },
  /** Пульсация логотипа на полноэкранной загрузке */
  logoPulse: {
    scale: [1, 1.06, 1],
    opacity: [0.82, 1, 0.82],
    duration: 1800,
    ease: 'easeInOut',
  },
  /** Пульсирующая точка на прогресс-баре плеера */
  progressDotPulse: {
    boxShadow: [
      '0 0 0 0 rgba(255,61,110,0.55)',
      '0 0 0 10px rgba(255,61,110,0)',
    ],
    duration: 1600,
    repeat: Infinity,
  },
  /** «В закладки»: heart-burst */
  heartBurst: {
    scale: [1, 1.35, 0.92, 1.08, 1],
    duration: 520,
    ease: EASE_SPRING,
  },
  /** Лайк комментария: ripple */
  commentRipple: {
    scale: [0, 2.4],
    opacity: [0.5, 0],
    duration: 600,
    ease: EASE_SOFT,
  },
  /** Смена качества плеера: morph-переход */
  qualityMorph: {
    from: { opacity: 0, transform: 'translateY(6px) scale(0.96)' },
    to: { opacity: 1, transform: 'translateY(0) scale(1)' },
    duration: durations.base,
    ease: EASE_FLOW,
  },
  /** Переключение табов на /download: контент перетекает */
  tabMorph: {
    from: { opacity: 0, transform: 'translateX(12px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
    duration: durations.screen,
    ease: EASE_FLOW,
  },
  /** Карточка тайтла при наведении */
  cardHover: {
    scale: 1.04,
    posterScale: 1.08,
    duration: durations.base,
    ease: EASE_FLOW,
  },
  /** Пульсация иконок платформ в DownloadHero */
  platformPulse: {
    scale: [1, 1.08, 1],
    duration: 2400,
    repeat: Infinity,
    ease: 'easeInOut',
  },
} as const

export type AnimationName = keyof typeof animations
