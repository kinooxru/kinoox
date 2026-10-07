import type { FastifyInstance } from 'fastify'
import {
  makeGetChangelog,
  makeGetDownloads,
  makeGetLatestVersion,
  makeGetVersions,
  makeRegisterDownload,
  type DownloadsControllerDeps,
} from './downloads.controller.js'

export interface DownloadsRoutesOptions {
  deps: DownloadsControllerDeps
}

/**
 * Роуты дистрибуции приложений.
 *
 * GET  /api/v1/downloads                       — все платформы для страницы /download
 * GET  /api/v1/downloads/changelog             — история версий
 * GET  /api/v1/downloads/:platform             — последняя версия
 * GET  /api/v1/downloads/:platform/versions    — все версии платформы
 * POST /api/v1/downloads/:platform/register    — счётчик скачиваний
 */
export default async function downloadsRoutes(
  fastify: FastifyInstance,
  options: DownloadsRoutesOptions,
): Promise<void> {
  const { deps } = options

  // Статические сегменты раньше параметрических
  fastify.get('/downloads', makeGetDownloads(deps))
  fastify.get('/downloads/changelog', makeGetChangelog(deps))
  fastify.get('/downloads/:platform', makeGetLatestVersion(deps))
  fastify.get('/downloads/:platform/versions', makeGetVersions(deps))
  fastify.post('/downloads/:platform/register', makeRegisterDownload(deps))
}
