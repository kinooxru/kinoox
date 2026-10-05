import type { HttpClient } from '../http/client'
import type {
  AuthResultDTO,
  AuthTokensDTO,
  LoginInput,
  RefreshInput,
  RegisterInput,
  UserDTO,
} from '../types/dto'

export function createAuthEndpoints(http: HttpClient) {
  return {
    /** POST /auth/register */
    register(input: RegisterInput): Promise<AuthResultDTO> {
      return http.request<AuthResultDTO>('/auth/register', {
        method: 'POST',
        body: input,
        skipAuth: true,
      })
    },

    /** POST /auth/login */
    login(input: LoginInput): Promise<AuthResultDTO> {
      return http.request<AuthResultDTO>('/auth/login', {
        method: 'POST',
        body: input,
        skipAuth: true,
      })
    },

    /** POST /auth/refresh */
    refresh(input: RefreshInput): Promise<AuthTokensDTO> {
      return http.request<AuthTokensDTO>('/auth/refresh', {
        method: 'POST',
        body: input,
        skipAuth: true,
        skipRefresh: true,
      })
    },

    /** POST /auth/logout */
    logout(): Promise<{ success: boolean }> {
      return http.request<{ success: boolean }>('/auth/logout', { method: 'POST' })
    },

    /** GET /user/profile */
    me(): Promise<UserDTO> {
      return http.request<UserDTO>('/user/profile')
    },
  }
}

export type AuthEndpoints = ReturnType<typeof createAuthEndpoints>