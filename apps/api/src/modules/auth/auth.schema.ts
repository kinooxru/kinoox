/**
 * Zod-схемы модуля авторизации.
 */
import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Некорректный адрес электронной почты').max(254),
  username: z
    .string()
    .trim()
    .min(3, 'Имя пользователя — минимум 3 символа')
    .max(32, 'Имя пользователя — максимум 32 символа')
    .regex(/^[a-zA-Zа-яА-Я0-9_.-]+$/, 'Имя пользователя может содержать буквы, цифры, _ . -'),
  password: z
    .string()
    .min(8, 'Пароль — минимум 8 символов')
    .max(128, 'Пароль — максимум 128 символов')
    .regex(/[a-zA-Zа-яА-Я]/, 'Пароль должен содержать хотя бы одну букву')
    .regex(/\d/, 'Пароль должен содержать хотя бы одну цифру'),
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Некорректный адрес электронной почты'),
  password: z.string().min(1, 'Введите пароль').max(128),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'Не передан refresh-токен'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RefreshInput = z.infer<typeof refreshSchema>
