import path from 'node:path'
import fs from 'node:fs'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { notFound } from '../../core/types'
import type { DownloadsService } from './downloads.service'

export interface DownloadStaticRoutesOptions {
  deps: {
    downloadsService: DownloadsService
  }
}

const MIME_TYPES: Record<string, string> = {
  '.apk': 'application/vnd.android.package-archive',
  '.exe': 'application/octet-stream',
  '.msi': 'application/octet-stream',
  '.dmg': 'application/octet-stream',
  '.AppImage': 'application/octet-stream',
  '.appimage': 'application/octet-stream',
  '.deb': 'application/x-debian-package',
  '.rpm': 'application/x-rpm',
  '.ipa': 'application/octet-stream',
  '.zip': 'application/zip',
}

/**
 * Раздача файлов установщиков приложений:
 * GET /downloads/:platform/:filename
 *
 * 1. Ищет файл в storage/downloads/:platform/:filename
 * 2. Автоматически регистрирует скачивание (+1 к счётчику загрузок)
 * 3. Отдаёт поток файла с правильными заголовками
 */
export default async function downloadStaticRoutes(
  fastify: FastifyInstance,
  options: DownloadStaticRoutesOptions,
): Promise<void> {
  const { downloadsService } = options.deps
  const storageRoot = path.resolve(process.cwd(), '../../storage/downloads')
  const localRoot = path.resolve(process.cwd(), 'storage/downloads')

  fastify.get('/downloads/:platform/:filename', async (
    request: FastifyRequest<{ Params: { platform: string; filename: string } }>,
    reply: FastifyReply,
  ) => {
    const { platform, filename } = request.params

    // Защита от path traversal
    const safeFilename = path.basename(filename)
    const safePlatform = path.basename(platform)

    let filePath = path.join(storageRoot, safePlatform, safeFilename)
    if (!fs.existsSync(filePath)) {
      filePath = path.join(localRoot, safePlatform, safeFilename)
    }

    if (!fs.existsSync(filePath)) {
      throw notFound(`Файл установки «${safeFilename}» не найден на сервере`)
    }

    const stat = fs.statSync(filePath)
    const ext = path.extname(safeFilename).toLowerCase()
    const contentType = MIME_TYPES[ext] ?? 'application/octet-stream'

    // Регистрируем скачивание в базе данных (увеличивает счётчик реальных загрузок)
    await downloadsService.registerDownload(safePlatform as 'android' | 'ios' | 'windows' | 'macos' | 'linux').catch(() => undefined)

    reply
      .header('Content-Type', contentType)
      .header('Content-Length', stat.size)
      .header('Content-Disposition', `attachment; filename="${safeFilename}"`)
      .header('Cache-Control', 'public, max-age=86400')

    const stream = fs.createReadStream(filePath)
    return reply.send(stream)
  })
}
