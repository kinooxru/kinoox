/**
 * Zod-схемы модуля дистрибуции приложений.
 */
import { z } from 'zod'

export const platformParamSchema = z.object({
  platform: z.enum(['android', 'ios', 'windows', 'macos', 'linux']),
})

export const changelogQuerySchema = z.object({
  platform: z.enum(['android', 'ios', 'windows', 'macos', 'linux']).optional(),
})

export type PlatformParam = z.infer<typeof platformParamSchema>
