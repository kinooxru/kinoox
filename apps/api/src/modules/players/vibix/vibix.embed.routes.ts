/**
 * HTML-обёртка для плеера Vibix.
 *
 * API Vibix не отдаёт прямую ссылку на фрейм: в ответе `iframe_url` всегда
 * пустой, а `embed_code` содержит только атрибуты `<ins>`. Плеер подключается
 * скриптом партнёра, который находит разметку на странице и подменяет её
 * фреймом.
 *
 * Этот роут отдаёт минимальный HTML-документ, который клиенты KINOOX
 * (сайт, мобильное и десктопное приложения) загружают в iframe. Такой подход
 * сохраняет единый интерфейс PlayerSource: iframeUrl остаётся ссылкой,
 * которую можно открыть, а параметры встраивания передаются в query.
 */
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { config } from '../../../config'

/** Скрипт SDK партнёра, который подменяет <ins> на плеер */
const RENDEX_SDK = 'https://graphicslab.io/sdk/v2/rendex-sdk.min.js'
/** Библиотека совместного просмотра подключается только при sync=1 */
const SYNC_LIB = 'https://sync.videoframe2.com/sync-lib.js'

const embedQuerySchema = z.object({
  publisher: z.string().min(1).max(64),
  type: z.enum(['kp', 'imdb', 'movie', 'series', 'serial']),
  id: z.string().min(1).max(64),
  title: z.string().max(300).optional(),
  poster: z.string().max(2000).optional(),
  trailer: z.enum(['true', 'only']).optional(),
  sync: z.enum(['0', '1']).optional(),
  season: z.coerce.number().int().min(1).max(100).optional(),
  episode: z.coerce.number().int().min(1).max(5000).optional(),
})

/** Экранирование значения атрибута для безопасной вставки в HTML */
function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Экранирование текста для заголовка документа */
function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export default async function vibixEmbedRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/players/vibix/embed', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = embedQuerySchema.parse(request.query)

    // Vibix SDK использует тип 'serial' для сериалов, транслируем устаревший 'series'
    const normalizedType = query.type === 'series' ? 'serial' : query.type

    // Атрибуты разметки: порядок и имена совпадают с embed_code из API Vibix
    const attributes = [
      `data-publisher-id="${escapeAttribute(query.publisher)}"`,
      `data-type="${normalizedType}"`,
      `data-id="${escapeAttribute(query.id)}"`,
    ]

    if (query.trailer) attributes.push(`data-trailer="${query.trailer}"`)
    if (query.sync === '1') attributes.push('data-sync="true"')
    // data-poster="true" заставляет плеер показать постер до запуска
    if (query.poster) attributes.push('data-poster="true"')
    if (query.season) attributes.push(`data-season="${query.season}"`)
    if (query.episode) attributes.push(`data-episode="${query.episode}"`)

    const markup = `<ins ${attributes.join(' ')}></ins>`
    const title = query.title ? escapeText(query.title) : 'KINOOX'

    // Заголовок серии для списка воспроизведения плеера
    const episodeHint =
      query.season && query.episode
        ? `<p class="hint">Сезон ${query.season} · Серия ${query.episode}</p>`
        : ''

    // min-height нужен, чтобы iframe не схлопнулся до загрузки плеера
    const html = `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <meta name="color-scheme" content="dark" />
    <meta name="robots" content="noindex, nofollow" />
    <title>${title} — KINOOX</title>
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        background: #06070A;
        color: #F5F7FA;
        font-family: Inter, system-ui, -apple-system, 'Segoe UI', sans-serif;
        overflow: hidden;
      }
      .stage {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 320px;
        background: #000;
      }
      .stage ins { display: block; width: 100%; height: 100%; }
      .stage iframe { width: 100%; height: 100%; border: 0; }
      .hint {
        position: absolute;
        left: 16px;
        bottom: 12px;
        margin: 0;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 11px;
        letter-spacing: 0.06em;
        color: rgba(139, 146, 168, 0.85);
        pointer-events: none;
      }
      .fallback {
        position: absolute;
        inset: 0;
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 24px;
        text-align: center;
      }
      .fallback strong { font-size: 15px; }
      .fallback span { font-size: 13px; color: #8B92A8; }
      .fallback .reason {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 11px;
        color: #4A5068;
        max-width: 90%;
        word-break: break-all;
      }
    </style>
  </head>
  <body>
    <div class="stage">
      ${markup}
      ${episodeHint}
      <div class="fallback" id="fallback">
        <strong>Плеер недоступен</strong>
        <span>Источник не отвечает. Попробуйте переключить балансер в приложении KINOOX.</span>
        <span class="reason" id="reason"></span>
      </div>
    </div>

    <script src="${RENDEX_SDK}"></script>
    ${
      query.sync === '1'
        ? `<script src="${SYNC_LIB}"></script>
    <script>
      // Совместный просмотр: комната берётся из ?room= или создаётся автоматически
      window.addEventListener('load', function () {
        if (typeof window.WatchParty !== 'function') return;
        var room = new URLSearchParams(window.location.search).get('room');
        window.kinooxParty = new window.WatchParty({ iframe: '.stage ins', roomId: room || undefined });
      });
    </script>`
        : ''
    }
    <script>
      // Диагностика: если SDK не превратил <ins> в плеер, показываем причину.
      // Это заметно полезнее пустого белого экрана.
      (function () {
        var stage = document.querySelector('.stage');
        var fallback = document.getElementById('fallback');
        var reason = document.getElementById('reason');

        function showFallback(text) {
          if (!fallback) return;
          if (reason && text) reason.textContent = text;
          fallback.style.display = 'flex';
        }

        var attempts = 0;
        var timer = setInterval(function () {
          attempts += 1;
          var frame = stage && stage.querySelector('iframe');
          if (frame) {
            clearInterval(timer);
            if (fallback) fallback.style.display = 'none';
            return;
          }
          // 20 секунд — с запасом на медленные сети
          if (attempts >= 100) {
            clearInterval(timer);
            showFallback('Плеер не загрузился за 20 секунд. Проверьте соединение.');
          }
        }, 200);

        // Если скрипт партнёра не загрузился — сообщаем точнее
        window.addEventListener('error', function (event) {
          if (event.target && event.target.tagName === 'SCRIPT') {
            showFallback('Скрипт плеера недоступен: ' + (event.target.src || 'неизвестный адрес'));
          }
        }, true);
      })();
    </script>
  </body>
</html>`

    return reply
      .header('Content-Type', 'text/html; charset=utf-8')
      // Обёртка одинакова для всех пользователей, но содержит свежие ссылки —
      // держим короткий кэш, чтобы не запрашивать её на каждый кадр
      .header('Cache-Control', 'public, max-age=300')
      .header('X-Robots-Tag', 'noindex, nofollow')
      // Встраивать обёртку могут только сам API и сайты из CORS_ORIGINS
      .header('Content-Security-Policy', `frame-ancestors 'self' ${config.server.corsOrigins.join(' ')}`)
      .send(html)
  })
}
