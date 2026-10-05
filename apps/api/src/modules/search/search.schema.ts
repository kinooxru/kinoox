/**
 * Zod-схемы модуля поиска.
 */
import { z } from 'zod'

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1, 'Введите поисковый запрос').max(120, 'Запрос слишком длинный'),
  type: z.enum(['movie', 'serial', 'cartoon', 'anime']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(24),
})

export const suggestQuerySchema = z.object({
  q: z.string().trim().min(1).max(120),
  limit: z.coerce.number().int().min(1).max(24).default(8),
})

export const trendingQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

export type SearchQueryInput = z.infer<typeof searchQuerySchema>
