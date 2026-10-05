import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Склейка классов: clsx + защита от конфликтов tailwind-классов.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Формат числа рейтинга: 8.1 → «8.1», 0 → «—» */
export function formatRating(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) return '—'
  return value.toFixed(1)
}

/**
 * Рейтинг считается «высоким» при значении больше 7 —
 * тогда бейдж получает градиент flux, иначе серый.
 */
export function isHighRating(value: number | null | undefined): boolean {
  return typeof value === 'number' && value > 7
}

/** Длительность в минутах → «2 ч 18 мин» / «48 мин» */
export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return '—'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} мин`
  if (rest === 0) return `${hours} ч`
  return `${hours} ч ${rest} мин`
}

/** Склонение: plural(5, 'тайтл', 'тайтла', 'тайтлов') → «тайтлов» */
export function plural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}

/** «1 234 567» — узкий неразрывный пробел */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value)
}

/** Склонение по типу тайтла для заголовков каталога */
export const TITLE_TYPE_LABELS: Record<string, string> = {
  movie: 'Фильмы',
  serial: 'Сериалы',
  cartoon: 'Мультфильмы',
  anime: 'Аниме',
}

export const TITLE_TYPE_SINGULAR: Record<string, string> = {
  movie: 'Фильм',
  serial: 'Сериал',
  cartoon: 'Мультфильм',
  anime: 'Аниме',
}
