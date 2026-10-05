/**
 * Zod-схемы модуля каталога.
 */
import { z } from 'zod'

export const titleTypeSchema = z.enum(['movie', 'serial', 'cartoon', 'anime'])
export const titleStatusSchema = z.enum(['ongoing', 'released', 'announced'])
export const titleSortSchema = z.enum(['rating', 'year', 'popular', 'newest'])

/** GET /titles */
export const titleFilterSchema = z.object({
  type: titleTypeSchema.optional(),
  genre: z.string().trim().min(1).max(64).optional(),
  country: z.string().trim().min(1).max(64).optional(),
  year: z.coerce.number().int().min(1900).max(2030).optional(),
  minRating: z.coerce.number().min(0).max(10).optional(),
  sort: titleSortSchema.default('popular'),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(24),
})

/** GET /titles/:id и вложенные ресурсы */
export const titleIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

/** Лимит для списков «похожие» и «сейчас смотрят» */
export const relatedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(48).default(12),
})

/** Тело запроса создания/обновления тайтла (админский роут) */
export const upsertTitleSchema = z.object({
  kpId: z.number().int().positive().nullish(),
  imdbId: z.string().trim().max(32).nullish(),
  type: titleTypeSchema,
  title: z.string().trim().min(1).max(300),
  originalTitle: z.string().trim().max(300).nullish(),
  description: z.string().max(20_000).nullish(),
  posterUrl: z.string().url().max(2000),
  backdropUrl: z.string().url().max(2000).nullish(),
  year: z.number().int().min(1900).max(2030),
  ratingKp: z.number().min(0).max(10).nullish(),
  ratingImdb: z.number().min(0).max(10).nullish(),
  duration: z.number().int().positive().nullish(),
  countries: z.array(z.string().trim().max(64)).max(30).default([]),
  genres: z.array(z.string().trim().max(64)).max(30).default([]),
  actors: z.array(z.string().trim().max(200)).max(100).default([]),
  directors: z.array(z.string().trim().max(200)).max(50).default([]),
  status: titleStatusSchema.default('released'),
})

export type TitleFilterInput = z.infer<typeof titleFilterSchema>
export type UpsertTitleInput = z.infer<typeof upsertTitleSchema>
