/**
 * KINOOX — типографика «Cinematic Flow».
 *
 * Шрифты: Space Grotesk (заголовки), Inter (текст), JetBrains Mono (технические элементы).
 * Размеры — fluid через clamp().
 */

export const fontFamilies = {
  display: "'Space Grotesk', 'Inter', system-ui, sans-serif",
  body: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace",
} as const

export type FontFamilyName = keyof typeof fontFamilies

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const

/** Fluid-размеры: clamp(минимум, предпочтительно, максимум) */
export const fontSizes = {
  hero: 'clamp(2.5rem, 6vw, 5rem)',
  h1: 'clamp(1.75rem, 3vw, 2.5rem)',
  h2: 'clamp(1.25rem, 2vw, 1.75rem)',
  h3: 'clamp(1.125rem, 1.5vw, 1.375rem)',
  body: 'clamp(0.875rem, 1vw, 1rem)',
  small: 'clamp(0.75rem, 0.8vw, 0.875rem)',
  tiny: '0.6875rem',
} as const

export type FontSizeName = keyof typeof fontSizes

export const lineHeights = {
  hero: 1.02,
  heading: 1.18,
  body: 1.6,
  small: 1.5,
  tight: 1.1,
} as const

export const letterSpacings = {
  hero: '-0.03em',
  heading: '-0.02em',
  body: '0',
  /** Логотип KINOOX — капсом с разрядкой */
  logo: '0.22em',
  caps: '0.12em',
} as const

/** Готовые текстовые стили */
export const textStyles = {
  hero: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes.hero,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.hero,
    letterSpacing: letterSpacings.hero,
  },
  h1: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes.h1,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.heading,
    letterSpacing: letterSpacings.heading,
  },
  h2: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes.h2,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.heading,
    letterSpacing: letterSpacings.heading,
  },
  h3: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.heading,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.body,
    letterSpacing: letterSpacings.body,
  },
  small: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.small,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.small,
  },
  /** Рейтинги, версии, размеры файлов, технические подписи */
  mono: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.small,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.tight,
  },
  logo: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes.h2,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.logo,
  },
} as const

export type TextStyleName = keyof typeof textStyles
