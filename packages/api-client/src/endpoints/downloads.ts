import type { HttpClient } from '../http/client'
import type { AppPlatform, AppVersionDTO, ChangelogEntry, DownloadsListDTO } from '../types/dto'

export function createDownloadsEndpoints(http: HttpClient) {
  return {
    /** GET /downloads — все платформы с описаниями, ссылками и скриншотами */
    list(): Promise<DownloadsListDTO> {
      return http.request<DownloadsListDTO>('/downloads', {
        skipAuth: true,
        next: { revalidate: 600, tags: ['downloads'] },
      })
    },

    /** GET /downloads/:platform — последняя версия для платформы */
    latest(platform: AppPlatform): Promise<AppVersionDTO | null> {
      return http.request<AppVersionDTO | null>(`/downloads/${platform}`, {
        skipAuth: true,
        next: { revalidate: 600, tags: ['downloads', `downloads:${platform}`] },
      })
    },

    /** GET /downloads/changelog — история версий */
    changelog(platform?: AppPlatform): Promise<ChangelogEntry[]> {
      return http.request<ChangelogEntry[]>('/downloads/changelog', {
        query: { platform },
        skipAuth: true,
        next: { revalidate: 600, tags: ['downloads'] },
      })
    },

    /** GET /downloads/:platform/versions — все версии платформы */
    versions(platform: AppPlatform): Promise<AppVersionDTO[]> {
      return http.request<AppVersionDTO[]>(`/downloads/${platform}/versions`, {
        skipAuth: true,
      })
    },

    /** POST /downloads/:platform/register — счётчик скачиваний */
    register(platform: AppPlatform): Promise<{ success: boolean }> {
      return http.request<{ success: boolean }>(`/downloads/${platform}/register`, {
        method: 'POST',
      })
    },
  }
}

export type DownloadsEndpoints = ReturnType<typeof createDownloadsEndpoints>