'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button, Card, Input, KinooxLogo } from '@kinoox/design-system'
import { useAuth } from '@/components/providers/AuthProvider'

export interface AuthFormProps {
  mode: 'login' | 'register'
}

const TEXT = {
  login: {
    title: 'Вход в KINOOX',
    subtitle: 'Продолжите просмотр с того места, где остановились.',
    submit: 'Войти',
    switchText: 'Ещё нет аккаунта?',
    switchLink: '/register',
    switchLabel: 'Зарегистрироваться',
  },
  register: {
    title: 'Регистрация в KINOOX',
    subtitle: 'Закладки, история и уведомления синхронизируются между всеми устройствами.',
    submit: 'Создать аккаунт',
    switchText: 'Уже есть аккаунт?',
    switchLink: '/login',
    switchLabel: 'Войти',
  },
} as const

interface FieldErrors {
  email?: string
  username?: string
  password?: string
  passwordConfirm?: string
}

/** Проверка полей на стороне клиента: те же правила, что и в Zod-схемах API */
function validate(mode: 'login' | 'register', values: Record<string, string>): FieldErrors {
  const errors: FieldErrors = {}

  const email = values.email?.trim() ?? ''
  if (!email) errors.email = 'Введите email'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Некорректный адрес'

  if (mode === 'register') {
    const username = values.username?.trim() ?? ''
    if (username.length < 3) errors.username = 'Минимум 3 символа'
    else if (username.length > 32) errors.username = 'Максимум 32 символа'
    else if (!/^[a-zA-Zа-яА-Я0-9_.-]+$/.test(username))
      errors.username = 'Только буквы, цифры, _ . -'

    const password = values.password ?? ''
    if (password.length < 8) errors.password = 'Минимум 8 символов'
    else if (!/[a-zA-Zа-яА-Я]/.test(password)) errors.password = 'Нужна хотя бы одна буква'
    else if (!/\d/.test(password)) errors.password = 'Нужна хотя бы одна цифра'

    if (values.passwordConfirm !== password) errors.passwordConfirm = 'Пароли не совпадают'
  } else if (!values.password) {
    errors.password = 'Введите пароль'
  }

  return errors
}

/** Форма входа и регистрации — общий компонент для /login и /register */
export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, register } = useAuth()
  const text = TEXT[mode]

  const [values, setValues] = React.useState({
    email: '',
    username: '',
    password: '',
    passwordConfirm: '',
  })
  const [errors, setErrors] = React.useState<FieldErrors>({})
  const [formError, setFormError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const next = searchParams.get('next') ?? '/'

  const update = (field: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setFormError(null)
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const validation = validate(mode, values)
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    setBusy(true)
    setFormError(null)

    try {
      if (mode === 'login') {
        await login(values.email.trim(), values.password)
      } else {
        await register(values.email.trim(), values.username.trim(), values.password)
      }
      router.push(next)
      router.refresh()
    } catch (caught) {
      setFormError(
        caught instanceof Error && caught.message
          ? caught.message
          : 'Не удалось выполнить запрос. Попробуйте ещё раз.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="kx-container flex min-h-[70vh] items-center justify-center py-16">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <KinooxLogo size={56} />
          <h1 className="mt-6 font-display text-[var(--text-h1)] font-bold tracking-[-0.02em] text-text-primary">
            {text.title}
          </h1>
          <p className="mt-3 text-[var(--text-small)] text-text-secondary">{text.subtitle}</p>
        </div>

        <Card variant="glass" padded className="!rounded-[28px]">
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={values.email}
              onChange={update('email')}
              error={errors.email}
              placeholder="you@example.com"
            />

            {mode === 'register' ? (
              <Input
                label="Имя пользователя"
                name="username"
                autoComplete="username"
                required
                value={values.username}
                onChange={update('username')}
                error={errors.username}
                hint="Отображается в комментариях и профиле"
                placeholder="kinoman"
              />
            ) : null}

            <Input
              label="Пароль"
              name="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              value={values.password}
              onChange={update('password')}
              error={errors.password}
              hint={mode === 'register' ? 'Минимум 8 символов, буква и цифра' : undefined}
            />

            {mode === 'register' ? (
              <Input
                label="Повторите пароль"
                name="passwordConfirm"
                type="password"
                autoComplete="new-password"
                required
                value={values.passwordConfirm}
                onChange={update('passwordConfirm')}
                error={errors.passwordConfirm}
              />
            ) : null}

            {formError ? (
              <p
                role="alert"
                className="rounded-xl border border-[rgba(255,69,58,0.35)] bg-[rgba(255,69,58,0.12)] px-4 py-3 text-[var(--text-small)] text-text-primary"
              >
                {formError}
              </p>
            ) : null}

            <Button type="submit" variant="flux" size="lg" fullWidth loading={busy}>
              {text.submit}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-[var(--text-small)] text-text-secondary">
          {text.switchText}{' '}
          <Link href={text.switchLink} className="text-prism-from underline-offset-4 hover:underline">
            {text.switchLabel}
          </Link>
        </p>
      </motion.div>
    </div>
  )
}