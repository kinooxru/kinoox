/**
 * Общие утилиты API.
 */
import { createHash } from 'node:crypto'
import type { ApiEnvelope, Paginated } from '../core/types'

/** Успешный ответ в едином конверте */
export function ok<T>(data: T): ApiEnvelope<T> {
  return { success: true, data, error: null }
}

/** Успешный ответ без тела */
export function okEmpty(): ApiEnvelope<{ success: boolean }> {
  return { success: true, data: { success: true }, error: null }
}

/** Постраничный ответ */
export function paginated<T>(
  items: T[],
  page: number,
  perPage: number,
  total: number,
): Paginated<T> {
  return {
    items,
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    },
  }
}

/** Нормализация номера страницы */
export function parsePagination(query: { page?: unknown; perPage?: unknown }, defaultPerPage = 24) {
  const page = Math.max(1, Number(query.page) || 1)
  const perPage = Math.min(100, Math.max(1, Number(query.perPage) || defaultPerPage))
  return { page, perPage, skip: (page - 1) * perPage, take: perPage }
}

/** Стабильный хэш параметров — для ключей кэша */
export function hashParams(params: Record<string, unknown>): string {
  const normalized = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join('&')
  return createHash('sha1').update(normalized).digest('hex').slice(0, 16)
}

/** Prisma Decimal → number | null */
export function toNumber(value: { toNumber(): number } | number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value
  return value.toNumber()
}

/** Убирает из строки управляющие символы и лишние пробелы */
export function sanitizeText(input: string): string {
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Приводит строку к безопасному slug (жанры, страны в URL) */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
}

/** Нормализация поискового запроса */
export function normalizeQuery(query: string): string {
  return sanitizeText(query).slice(0, 120)
}
