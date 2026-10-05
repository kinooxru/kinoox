import type { HttpClient } from '../http/client'
import type { CommentDTO, CreateCommentInput, PaginatedResponse } from '../types/dto'

export function createCommentsEndpoints(http: HttpClient) {
  return {
    /** GET /titles/:id/comments */
    listByTitle(
      titleId: number,
      page = 1,
      perPage = 30,
    ): Promise<PaginatedResponse<CommentDTO>> {
      return http.request<PaginatedResponse<CommentDTO>>(`/titles/${titleId}/comments`, {
        query: { page, perPage },
        skipAuth: true,
      })
    },

    /** POST /titles/:id/comments */
    create(titleId: number, input: CreateCommentInput): Promise<CommentDTO> {
      return http.request<CommentDTO>(`/titles/${titleId}/comments`, {
        method: 'POST',
        body: input,
      })
    },

    /** DELETE /comments/:id */
    remove(commentId: number): Promise<{ success: boolean }> {
      return http.request<{ success: boolean }>(`/comments/${commentId}`, { method: 'DELETE' })
    },

    /** POST /comments/:id/like */
    like(commentId: number): Promise<{ likesCount: number }> {
      return http.request<{ likesCount: number }>(`/comments/${commentId}/like`, {
        method: 'POST',
      })
    },
  }
}

export type CommentsEndpoints = ReturnType<typeof createCommentsEndpoints>