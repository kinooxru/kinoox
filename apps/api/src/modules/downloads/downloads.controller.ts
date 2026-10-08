/**
 * HTTP-обработчики модуля дистрибуции приложений.
 */
import type { FastifyReply, FastifyRequest } from 'fastify'
import { ok } from '../../utils'
import { changelogQuerySchema, platformParamSchema } from './downloads.schema'
import type { DownloadsService } from './downloads.service'

export interface DownloadsControllerDeps {
  downloadsService: DownloadsService
}

/** GET /downloads */
export function makeGetDownloads(deps: DownloadsControllerDeps) {
  return async function getDownloads(_request: FastifyRequest, reply: FastifyReply) {
    const result = await deps.downloadsService.getPlatforms()
    return reply.send(ok(result))
  }
}

/** GET /downloads/changelog — объявлен до /downloads/:platform */
export function makeGetChangelog(deps: DownloadsControllerDeps) {
  return async function getChangelog(request: FastifyRequest, reply: FastifyReply) {
    const { platform } = changelogQuerySchema.parse(request.query)
    const entries = await deps.downloadsService.getChangelog(platform)
    return reply.send(ok(entries))
  }
}

/** GET /downloads/:platform */
export function makeGetLatestVersion(deps: DownloadsControllerDeps) {
  return async function getLatestVersion(request: FastifyRequest, reply: FastifyReply) {
    const { platform } = platformParamSchema.parse(request.params)
    const version = await deps.downloadsService.getLatest(platform)
    return reply.send(ok(version))
  }
}

/** GET /downloads/:platform/versions */
export function makeGetVersions(deps: DownloadsControllerDeps) {
  return async function getVersions(request: FastifyRequest, reply: FastifyReply) {
    const { platform } = platformParamSchema.parse(request.params)
    const versions = await deps.downloadsService.getVersions(platform)
    return reply.send(ok(versions))
  }
}

/** POST /downloads/:platform/register — счётчик скачиваний */
export function makeRegisterDownload(deps: DownloadsControllerDeps) {
  return async function registerDownload(request: FastifyRequest, reply: FastifyReply) {
    const { platform } = platformParamSchema.parse(request.params)
    await deps.downloadsService.registerDownload(platform)
    return reply.send(ok({ success: true }))
  }
}
