export * from './Button'
export * from './Card'
export * from './Input'
export * from './Badge'
export * from './Skeleton'
export * from './Tabs'
export * from './Modal'

/** Утилиты дизайн-системы доступны из основной точки входа */
export {
  cn,
  formatRating,
  isHighRating,
  formatDuration,
  plural,
  formatNumber,
  TITLE_TYPE_LABELS,
  TITLE_TYPE_SINGULAR,
} from '../utils/cn'
export { classNames, cssVars, ratingTone } from '../utils/classes'
