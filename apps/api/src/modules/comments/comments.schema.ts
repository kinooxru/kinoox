/**
 * Zod-схемы модуля комментариев.
 */
import { z } from 'zod'

export const createCommentSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Комментарий не может быть пустым')
    .max(4000, 'Комментарий — максимум 4000 символов'),
  parentId: z.coerce.number().int().positive().optional(),
})

export const commentIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const titleCommentsParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const commentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(30),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>
