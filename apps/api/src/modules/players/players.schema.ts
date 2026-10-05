/**
 * Схемы валидации модуля балансеров.
 */
import { z } from 'zod'

export const playerQuerySchema = z.object({
  /** Сезон сериала */
  season: z.coerce.number().int().min(1).max(100).optional(),
  /** Номер серии */
  episode: z.coerce.number().int().min(1).max(5000).optional(),
  /** Показать трейлер, если полной версии нет */
  trailer: z
    .union([z.boolean(), z.enum(['true', 'false', 'only'])])
    .transform((value) => (value === 'only' ? 'only' : value === true || value === 'true'))
    .optional(),
  /** Совместный просмотр */
  sync: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((value) => value === true || value === 'true')
    .optional(),
  /** Показать постер до запуска */
  poster: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((value) => value === true || value === 'true')
    .optional(),
})

export const balancerParamSchema = z.object({
  balancer: z.enum(['vibix', 'veoveo']),
})

export type PlayerQuery = z.infer<typeof playerQuerySchema>
export type BalancerParam = z.infer<typeof balancerParamSchema>
