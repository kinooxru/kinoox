/**
 * Бизнес-логика авторизации: регистрация, вход, обновление токенов.
 * Не знает ничего про HTTP.
 */
import { createHash } from 'node:crypto'
import bcrypt from 'bcryptjs'
import type { PrismaClient } from '@prisma/client'
import type { AuthResultDTO, AuthTokensDTO, UserDTO } from '@kinoox/api-client'
import { config } from '../../config.js'
import { conflict, unauthorized } from '../../core/types'
import type { JwtPayload } from '../../core/plugins/jwt.plugin'

const BCRYPT_ROUNDS = 12

/** Минимальный набор полей пользователя, нужный сервису */
interface UserRow {
  id: number
  email: string
  username: string
  avatarUrl: string | null
  role: string
  createdAt: Date
}

export interface TokenSigner {
  signAccess(payload: Omit<JwtPayload, 'type'>): string
  signRefresh(payload: Omit<JwtPayload, 'type'>): string
}

export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly signer: TokenSigner,
  ) {}

  async register(input: { email: string; username: string; password: string }): Promise<AuthResultDTO> {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: input.email }, { username: input.username }] },
      select: { email: true, username: true },
    })

    if (existing) {
      throw conflict(
        existing.email === input.email
          ? 'Пользователь с таким email уже зарегистрирован'
          : 'Такое имя пользователя уже занято',
      )
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        passwordHash,
        role: 'user',
      },
    })

    const tokens = await this.issueTokens(user)
    return { user: this.toDto(user), tokens }
  }

  async login(input: { email: string; password: string }): Promise<AuthResultDTO> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } })

    // Одинаковое сообщение, чтобы не раскрывать существование аккаунта
    if (!user) throw unauthorized('Неверный email или пароль')

    const valid = await bcrypt.compare(input.password, user.passwordHash)
    if (!valid) throw unauthorized('Неверный email или пароль')

    const tokens = await this.issueTokens(user)
    return { user: this.toDto(user), tokens }
  }

  /** Обновление пары токенов; старый refresh-токен отзывается */
  async refresh(refreshToken: string): Promise<AuthTokensDTO> {
    const payload = await this.verifyRefresh(refreshToken)
    if (!payload) throw unauthorized('Refresh-токен недействителен или истёк')

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) throw unauthorized('Учётная запись не найдена')

    const expectedHash = this.hashToken(refreshToken)
    if (user.refreshTokenHash && user.refreshTokenHash !== expectedHash) {
      throw unauthorized('Refresh-токен отозван — войдите заново')
    }

    return this.issueTokens(user)
  }

  /** Выход: refresh-токен отзывается */
  async logout(userId: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    })
  }

  async getProfile(userId: number): Promise<UserDTO> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw unauthorized('Учётная запись не найдена')
    return this.toDto(user)
  }

  // ── Внутреннее ─────────────────────────────────────────────

  private async issueTokens(user: UserRow): Promise<AuthTokensDTO> {
    const base: Omit<JwtPayload, 'type'> = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    }

    const accessToken = this.signer.signAccess(base)
    const refreshToken = this.signer.signRefresh(base)

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: this.hashToken(refreshToken) },
    })

    return {
      accessToken,
      refreshToken,
      expiresIn: config.jwt.accessTtl,
    }
  }

  private async verifyRefresh(token: string): Promise<JwtPayload | null> {
    try {
      const payload = await this.verify(token)
      if (payload.type !== 'refresh') return null
      return payload
    } catch {
      return null
    }
  }

  /** Передаётся из плагина JWT через замыкание при сборке приложения */
  private verify: (token: string) => Promise<JwtPayload> = async () => {
    throw unauthorized('Верификатор токенов не настроен')
  }

  /** Позволяет приложению подставить реальный верификатор refresh-токенов */
  withRefreshVerifier(verifier: (token: string) => Promise<JwtPayload>): this {
    this.verify = verifier
    return this
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  private toDto(user: UserRow): UserDTO {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    }
  }
}
