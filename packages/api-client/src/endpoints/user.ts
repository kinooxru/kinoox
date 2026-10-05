import type { HttpClient } from '../http/client'
import type {
  BookmarkDTO,
  CreateBookmarkInput,
  CreateHistoryInput,
  PaginatedResponse,
  UpdateBookmarkInput,
  UserDTO,
  ViewHistoryDTO,
} from '../types/dto'

export function createUserEndpoints(http: HttpClient) {
  return {
    /** GET /user/profile */
    profile(): Promise<UserDTO> {
      return http.request<UserDTO>('/user/profile')
    },

    /** PATCH /user/profile */
    updateProfile(input: Partial<Pick<UserDTO, 'username' | 'avatarUrl'>>): Promise<UserDTO> {
      return http.request<UserDTO>('/user/profile', { method: 'PATCH', body: input })
    },

    /** GET /user/bookmarks */
    bookmarks(page = 1, perPage = 50): Promise<PaginatedResponse<BookmarkDTO>> {
      return http.request<PaginatedResponse<BookmarkDTO>>('/user/bookmarks', {
        query: { page, perPage },
      })
    },

    /** GET /user/bookmarks/counters — сводка по статусам */
    bookmarkCounters(): Promise<Record<string, number>> {
      return http.request<Record<string, number>>('/user/bookmarks/counters')
    },

    /** GET /user/bookmarks/:titleId/status — для иконки «сердце» */
    bookmarkStatus(titleId: number): Promise<{ bookmarked: boolean; status: string | null }> {
      return http.request<{ bookmarked: boolean; status: string | null }>(
        `/user/bookmarks/${titleId}/status`,
      )
    },

    /** POST /user/bookmarks */
    addBookmark(input: CreateBookmarkInput): Promise<BookmarkDTO> {
      return http.request<BookmarkDTO>('/user/bookmarks', { method: 'POST', body: input })
    },

    /** PATCH /user/bookmarks/:titleId */
    updateBookmark(titleId: number, input: UpdateBookmarkInput): Promise<BookmarkDTO> {
      return http.request<BookmarkDTO>(`/user/bookmarks/${titleId}`, {
        method: 'PATCH',
        body: input,
      })
    },

    /** DELETE /user/bookmarks/:titleId */
    removeBookmark(titleId: number): Promise<{ success: boolean }> {
      return http.request<{ success: boolean }>(`/user/bookmarks/${titleId}`, {
        method: 'DELETE',
      })
    },

    /** GET /user/history */
    history(page = 1, perPage = 50): Promise<PaginatedResponse<ViewHistoryDTO>> {
      return http.request<PaginatedResponse<ViewHistoryDTO>>('/user/history', {
        query: { page, perPage },
      })
    },

    /** POST /user/history */
    addHistory(input: CreateHistoryInput): Promise<ViewHistoryDTO> {
      return http.request<ViewHistoryDTO>('/user/history', { method: 'POST', body: input })
    },

    /** DELETE /user/history */
    clearHistory(): Promise<{ success: boolean }> {
      return http.request<{ success: boolean }>('/user/history', { method: 'DELETE' })
    },
  }
}

export type UserEndpoints = ReturnType<typeof createUserEndpoints>