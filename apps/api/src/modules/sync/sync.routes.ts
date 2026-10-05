import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { notFound } from '../../core/types'
import { ok } from '../../utils'
import type { CatalogSyncService } from './catalog.sync.service'

const idParamSchema = z.object({ id: z.coerce.number().int().positive() })

export interface SyncRoutesOptions {
  deps: {
    syncService: CatalogSyncService
    loadTitleRefs: (titleId: number) => Promise<{ kpId: number | null; titleId: number } | null>
  }
}

export default async function syncRoutes(
  fastify: FastifyInstance,
  options: SyncRoutesOptions,
): Promise<void> {
  const { syncService, loadTitleRefs } = options.deps

  // POST /titles/:id/sync — актуализировать один тайтл из балансеров
  fastify.post('/titles/:id/sync', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = idParamSchema.parse(request.params)
    const title = await loadTitleRefs(id)
    if (!title || !title.kpId) {
      throw notFound('Тайтл не найден или у него не указан ID Кинопоиска')
    }

    const result = await syncService.syncByKpId(title.kpId)
    if (!result) {
      throw notFound('Данные по тайтлу не найдены в балансерах')
    }

    return reply.send(ok(result))
  })

  // POST /admin/sync — синхронизировать весь существующий каталог
  fastify.post('/admin/sync', async (_request: FastifyRequest, reply: FastifyReply) => {
    const results = await syncService.syncAllExistingTitles()
    return reply.send(ok({ total: results.length, items: results }))
  })

  // POST /admin/sync/latest — автоматически импортировать свежие фильмы, сериалы, мультфильмы и аниме
  fastify.post('/admin/sync/latest', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = z
      .object({
        pages: z.coerce.number().int().min(1).max(20).default(3),
        limit: z.coerce.number().int().min(10).max(100).default(50),
      })
      .parse(request.query)

    const result = await syncService.importLatestFromBalancers({
      veoveoPages: query.pages,
      vibixLimit: query.limit,
    })
    return reply.send(ok(result))
  })

  // POST /admin/sync/kp/:kpId — импортировать конкретный тайтл по ID Кинопоиска
  fastify.post('/admin/sync/kp/:kpId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { kpId } = z.object({ kpId: z.coerce.number().int().positive() }).parse(request.params)
    const result = await syncService.syncByKpId(kpId)
    if (!result) {
      throw notFound(`Контент с ID Кинопоиска ${kpId} не найден в балансерах`)
    }
    return reply.send(ok(result))
  })
}
