/**
 * Хранилище токенов в SecureStore: на Android — EncryptedSharedPreferences,
 * на iOS — Keychain. Токены не попадают в AsyncStorage.
 */
import * as SecureStore from 'expo-secure-store'
import type { AuthTokensDTO, TokenStorage } from '@kinoox/api-client'
import { mobileConfig } from './config'

export class SecureTokenStorage implements TokenStorage {
  private accessToken: string | null = null
  private refreshToken: string | null = null

  /** Загружает токены из защищённого хранилища — вызывается при старте приложения */
  async hydrate(): Promise<void> {
    try {
      const [access, refresh] = await Promise.all([
        SecureStore.getItemAsync(mobileConfig.storageKeys.accessToken),
        SecureStore.getItemAsync(mobileConfig.storageKeys.refreshToken),
      ])
      this.accessToken = access
      this.refreshToken = refresh
    } catch {
      this.accessToken = null
      this.refreshToken = null
    }
  }

  getAccessToken(): string | null {
    return this.accessToken
  }

  getRefreshToken(): string | null {
    return this.refreshToken
  }

  setTokens(tokens: AuthTokensDTO): void {
    this.accessToken = tokens.accessToken
    this.refreshToken = tokens.refreshToken || this.refreshToken

    void Promise.all([
      SecureStore.setItemAsync(mobileConfig.storageKeys.accessToken, tokens.accessToken),
      tokens.refreshToken
        ? SecureStore.setItemAsync(mobileConfig.storageKeys.refreshToken, tokens.refreshToken)
        : Promise.resolve(),
    ]).catch(() => undefined)
  }

  clear(): void {
    this.accessToken = null
    this.refreshToken = null
    void Promise.all([
      SecureStore.deleteItemAsync(mobileConfig.storageKeys.accessToken),
      SecureStore.deleteItemAsync(mobileConfig.storageKeys.refreshToken),
    ]).catch(() => undefined)
  }
}

export const tokenStorage = new SecureTokenStorage()
