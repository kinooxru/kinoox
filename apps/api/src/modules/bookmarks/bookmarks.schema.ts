/**
 * Zod-схемы модуля закладок.
 */
import { z } from 'zod'

export const bookmarkStatusSchema = z.enum(['watching', 'planned', 'completed', 'dropped', 'on_hold'])

export const createBookmarkSchema = z.object({
  titleId: z.coerce.number().int().positive(),
  status: bookmarkStatusSchema.default('watching'),
  lastSeason: z.coerce.number().int().min(1).max(100).optional(),
  lastEpisode: z.coerce.number().int().min(1).max(5000).optional(),
})

export const updateBookmarkSchema = z
  .object({
    status: bookmarkStatusSchema.optional(),
    lastSeason: z.coerce.number().int().min(1).max(100).nullable().optional(),
    lastEpisode: z.coerce.number().int().min(1).max(5000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Не передано ни одного поля для обновления',
  })

export const bookmarkTitleParamSchema = z.object({
  titleId: z.coerce.number().int().positive(),
})

export const bookmarkQuerySchema = z.object({
  status: bookmarkStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(50),
})

export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>
export type UpdateBookmarkInput = z.infer<typeof updateBookmarkSchema>
