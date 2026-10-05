import type { HttpClient } from '../http/client'
import type { HealthDTO, NotificationDTO, SystemStatsDTO } from '../types/dto'

export function createSystemEndpoints(http: HttpClient) {
  return {
    /** GET /api/health — healthcheck для Docker */
    health(): Promise<HealthDTO> {
      return http.request<HealthDTO>('/health', { skipAuth: true, skipRefresh: true })
    },

    /** GET /stats — реальная статистика проекта (тайтлы, пользователи, рейтинг, загрузки) */
    stats(): Promise<SystemStatsDTO> {
      return http.request<SystemStatsDTO>('/stats', {
        skipAuth: true,
        skipRefresh: true,
        next: { revalidate: 0 },
      })
    },

    /** GET /notifications */
    notifications(): Promise<NotificationDTO[]> {
      return http.request<NotificationDTO[]>('/notifications')
    },

    /** POST /notifications/read */
    markRead(ids: string[]): Promise<{ success: boolean }> {
      return http.request<{ success: boolean }>('/notifications/read', {
        method: 'POST',
        body: { ids },
      })
    },

    /** POST /notifications/subscribe */
    subscribe(titleId: number): Promise<{ success: boolean }> {
      return http.request<{ success: boolean }>('/notifications/subscribe', {
        method: 'POST',
        body: { titleId },
      })
    },

    /** DELETE /notifications/subscribe/:titleId */
    unsubscribe(titleId: number): Promise<{ success: boolean }> {
      return http.request<{ success: boolean }>(`/notifications/subscribe/${titleId}`, {
        method: 'DELETE',
      })
    },
  }
}

export type SystemEndpoints = ReturnType<typeof createSystemEndpoints>