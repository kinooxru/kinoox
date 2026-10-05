/**
 * Zod-схемы модуля пользователей.
 */
import { z } from 'zod'

export const updateProfileSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, 'Имя пользователя — минимум 3 символа')
      .max(32, 'Имя пользователя — максимум 32 символа')
      .regex(/^[a-zA-Zа-яА-Я0-9_.-]+$/, 'Имя пользователя может содержать буквы, цифры, _ . -')
      .optional(),
    avatarUrl: z.string().url('Некорректная ссылка на аватар').max(2000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Не передано ни одного поля для обновления',
  })

export const historyInputSchema = z.object({
  titleId: z.coerce.number().int().positive(),
  season: z.coerce.number().int().min(1).max(100).optional(),
  episode: z.coerce.number().int().min(1).max(5000).optional(),
})

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(50),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type HistoryInput = z.infer<typeof historyInputSchema>
