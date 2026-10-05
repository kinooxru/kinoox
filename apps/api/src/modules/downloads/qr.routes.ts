/**
 * Роут генерации QR-кодов:
 *   GET /api/qr?data=<строка>&size=<число>
 *
 * Отдаёт чистый SVG со статусом 200 и Content-Type image/svg+xml.
 * Используется страницей /download для скачивания APK/IPA на телефон.
 */
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { generateQrSvg } from './qr'

const qrQuerySchema = z.object({
  data: z.string().min(1, 'Не переданы данные').max(1024, 'Данные слишком длинные'),
  size: z.coerce.number().int().min(64).max(1024).default(200),
})

export default async function qrRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/qr', async (request: FastifyRequest, reply: FastifyReply) => {
    const { data, size } = qrQuerySchema.parse(request.query)

    try {
      const svg = generateQrSvg(data, {
        size,
        darkColor: '#06070A',
        lightColor: '#FFFFFF',
        margin: 2,
      })

      return reply
        .header('Content-Type', 'image/svg+xml; charset=utf-8')
        .header('Cache-Control', 'public, max-age=86400, immutable')
        .send(svg)
    } catch {
      return reply.code(400).send({
        success: false,
        data: null,
        error: 'Не удалось сгенерировать QR-код',
      })
    }
  })
}
