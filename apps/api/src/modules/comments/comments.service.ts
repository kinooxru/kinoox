/**
 * Бизнес-логика комментариев: плоские списки с одним уровнем ответов.
 */
import type { PrismaClient } from '@prisma/client'
import type { CommentDTO, PaginatedResponse } from '@kinoox/api-client'
import { forbidden, notFound } from '../../core/types'
import { paginated, sanitizeText } from '../../utils'

const USER_SELECT = { id: true, username: true, avatarUrl: true } as const

export class CommentsService {
  constructor(private readonly prisma: PrismaClient) {}

  async listByTitle(
    titleId: number,
    page: number,
    perPage: number,
  ): Promise<PaginatedResponse<CommentDTO>> {
    await this.ensureTitleExists(titleId)

    const where = { titleId, parentId: null }

    const [roots, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        include: {
          user: { select: USER_SELECT },
          replies: {
            include: { user: { select: USER_SELECT } },
            orderBy: { createdAt: 'asc' },
            take: 20,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.comment.count({ where }),
    ])

    return paginated(roots.map((comment) => this.toDto(comment, true)), page, perPage, total)
  }

  async create(
    titleId: number,
    userId: number,
    input: { text: string; parentId?: number },
  ): Promise<CommentDTO> {
    await this.ensureTitleExists(titleId)

    let parentId: number | null = null
    if (input.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: input.parentId },
        select: { id: true, titleId: true, parentId: true },
      })
      if (!parent || parent.titleId !== titleId) throw notFound('Комментарий, на который вы отвечаете, не найден')
      // Глубина ответов — один уровень: ответ на ответ прикрепляется к корню
      parentId = parent.parentId ?? parent.id
    }

    const comment = await this.prisma.comment.create({
      data: {
        titleId,
        userId,
        parentId,
        text: sanitizeText(input.text),
      },
      include: { user: { select: USER_SELECT } },
    })

    return this.toDto(comment, false)
  }

  async remove(commentId: number, userId: number, isAdmin: boolean): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true },
    })
    if (!comment) throw notFound('Комментарий не найден')
    if (comment.userId !== userId && !isAdmin) {
      throw forbidden('Можно удалять только свои комментарии')
    }

    await this.prisma.comment.delete({ where: { id: commentId } })
  }

  /** Лайк комментария — ripple-анимация в интерфейсе */
  async like(commentId: number): Promise<{ likesCount: number }> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true },
    })
    if (!comment) throw notFound('Комментарий не найден')

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: { likesCount: { increment: 1 } },
      select: { likesCount: true },
    })

    return { likesCount: updated.likesCount }
  }

  private async ensureTitleExists(titleId: number): Promise<void> {
    const exists = await this.prisma.title.findUnique({ where: { id: titleId }, select: { id: true } })
    if (!exists) throw notFound('Тайтл не найден')
  }

  private toDto(
    comment: {
      id: number
      titleId: number
      userId: number
      parentId: number | null
      text: string
      createdAt: Date
      user: { id: number; username: string; avatarUrl: string | null }
      replies?: Array<{
        id: number
        titleId: number
        userId: number
        parentId: number | null
        text: string
        createdAt: Date
        user: { id: number; username: string; avatarUrl: string | null }
      }>
    },
    withReplies: boolean,
  ): CommentDTO {
    return {
      id: comment.id,
      titleId: comment.titleId,
      userId: comment.userId,
      parentId: comment.parentId,
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
      user: {
        id: comment.user.id,
        username: comment.user.username,
        avatarUrl: comment.user.avatarUrl,
      },
      replies:
        withReplies && comment.replies
          ? comment.replies.map((reply) => this.toDto(reply, false))
          : undefined,
    }
  }
}
