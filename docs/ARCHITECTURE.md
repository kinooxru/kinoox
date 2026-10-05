# Архитектура KINOOX

## Общая схема

```
                         ┌──────────────────────┐
   Пользователь ────────▶│  Nginx :80/:443      │
   (браузер)             │  SSL, кэш, rate-limit│
                         └──────────┬───────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  ▼                 ▼                 ▼
          ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
          │ web :3000    │  │ api :3001    │  │ MinIO :9000  │
          │ Next.js SSR  │──│ Fastify      │  │ файлы сборок │
          └──────────────┘  └──────┬───────┘  └──────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
            ┌────────────┐  ┌───────────┐  ┌─────────────┐
            │ PostgreSQL │  │ Redis     │  │ Vibix /     │
            │ 16         │  │ 7 (кэш)   │  │ VeoVeo API  │
            └────────────┘  └───────────┘  └─────────────┘

   Клиенты: браузер · React Native (Android, iOS) · Tauri 2 (Windows, macOS, Linux)
```

## Монорепозиторий

| Пакет | Назначение | Технологии |
|---|---|---|
| `apps/web` | Сайт | Next.js 14 App Router, React 18, Framer Motion |
| `apps/api` | Бэкенд | Fastify 5, Prisma 6, Redis, Socket.io |
| `apps/mobile` | Мобильные приложения | React Native 0.76, Expo 52, Reanimated 3 |
| `apps/desktop` | Десктопные приложения | Tauri 2, Rust, Vite |
| `packages/design-system` | Дизайн-система | TypeScript, CSS-переменные |
| `packages/api-client` | HTTP-клиент и DTO | TypeScript, fetch |

Связи между пакетами — только через `packages/api-client` (типы и запросы)
и `packages/design-system` (токены). Прямых импортов кода приложения из
приложения нет.

## Модульная архитектура API

Каждый модуль в `apps/api/src/modules/<name>/` следует одному паттерну:

```
<name>.types.ts       типы модуля
<name>.schema.ts      Zod-валидация входящих данных
<name>.service.ts     бизнес-логика (не знает про HTTP)
<name>.controller.ts  тонкие обработчики: валидация → сервис → ответ
<name>.routes.ts      регистрация роутов
```

Модули:

- `titles` — каталог, фильтры, подборки, похожие
- `auth` — регистрация, вход, обновление и отзыв токенов
- `users` — профиль и история просмотров
- `bookmarks` — закладки со статусами и счётчиками
- `comments` — комментарии с одним уровнем ответов
- `search` — поиск, подсказки, популярные запросы
- `players` — балансеры видео и оркестратор
- `downloads` — версии приложений для страницы `/download`
- `notifications` — уведомления через Socket.io
- `health` — healthcheck для Docker и мониторинга

## Балансеры видео

`PlayersOrchestrator` перебирает сервисы по приоритету. Каждый балансер
реализует интерфейс `IBalancerService`:

```ts
interface IBalancerService {
  readonly name: 'vibix' | 'veoveo'
  readonly priority: number
  readonly enabled: boolean
  getPlayerByKpId(kpId: number, options?): Promise<PlayerSource | null>
  getPlayerByImdbId(imdbId: string, options?): Promise<PlayerSource | null>
  getPlayerById(id: string, options?): Promise<PlayerSource | null>
  getEpisodes(kpId: number): Promise<SeasonInfo[]>
  getTitleInfo(kpId: number): Promise<BalancerTitleInfo | null>
}
```

- **Vibix** (`vibix.org`) — Bearer-токен формата `<publisher_id>|<token>`,
  эндпоинты `/api/v1/publisher/videos/*` и `/api/v1/serials/*`.
- **VeoVeo** (`webmaster-api.rstprgapipt.com`) — Bearer JWT,
  каталог через `POST /v1/contents` и фильтры `/v1/filters/*`.
- **Mock** — используется при `PLAYERS_MODE=mock`, полностью повторяет
  формат ответа реальных сервисов.

Если один балансер не отвечает или не нашёл тайтл, оркестратор молча
переходит к следующему: ошибка источника не ломает выдачу.

## Кэширование

| Слой | Что кэшируется | TTL |
|---|---|---|
| Redis | списки каталога, тайтл, серии, источники | 300–600 с |
| Redis | подборки главной, фильтры | 300–3600 с |
| Redis | подсказки поиска | 120 с |
| Redis | версии приложений | 600 с |
| Next.js ISR | страницы каталога, тайтла, `/download` | 300–600 с |
| Nginx | SSR-страницы | 5 мин |
| Nginx | API GET | 60 с |
| Nginx | статика `_next/static`, бренд, скриншоты | 30 дней |

API работает и без Redis: `CacheService` переходит в режим «сквозной»
(skip cache), все запросы идут в PostgreSQL.

## Дизайн-система «Cinematic Flow»

Токены живут в `packages/design-system/src/tokens/` и дублируются в
CSS-переменных `theme.css`. Ключевые значения:

- палитра: `void #06070A`, `abyss #0C0E14`, `surface #131620`, `frost #1C2030`
- акценты-градиенты: `flux #FF3D6E → #FF6B3D`, `prism #7C5CFF → #5C8CFF`,
  `aura #00E5C7 → #00B8E5`
- текст: `#F5F7FA`, `#8B92A8`, `#4A5068`
- радиус карточек — 20px, панелей — 28px
- основная кривая анимации — `cubic-bezier(0.16, 1, 0.3, 1)`
- переход между экранами — 400 мс, снизу с `scale(0.95 → 1)`

## Realtime

Socket.io поднят на том же HTTP-сервере, что и Fastify (`/socket.io`).

Комнаты:

- `user:<id>` — персональные уведомления;
- `title:<id>` — события конкретного тайтла;
- `party:<roomId>` — совместный просмотр.

События: `notification`, `new_episode`, `watch_party:sync`,
`watch_party:join`, `watch_party:leave`.

## Безопасность

- Пароли — bcrypt с 12 раундами.
- JWT: access 15 минут, refresh 30 дней; refresh-токен хранится в БД
  как SHA-256 хэш и отзывается при выходе.
- Rate limiting: 120 запросов в минуту глобально, 10 попыток входа
  за 5 минут, 30 комментариев в минуту.
- Контейнеры: `no-new-privileges`, `cap_drop: ALL` с точечным `cap_add`.
- Сети Docker разделены: `frontend` (публичная), `backend` и
  `monitoring` (internal).

## Развёртывание

Продакшн — Debian 12, `95.216.97.185`, домен `kinoox.ru`.
20 контейнеров, память распределена так:

| Сервис | Лимит |
|---|---|
| PostgreSQL | 32 ГБ |
| API | 8 ГБ |
| Web | 8 ГБ |
| Redis | 4 ГБ |
| MinIO | 2 ГБ |
| Prometheus | 2 ГБ |
| Loki | 2 ГБ |
| Grafana, cAdvisor | по 1 ГБ |
| Promtail | 512 МБ |
| Adminer, Alertmanager | по 256 МБ |
| Итого | ~61,5 ГБ из 64 ГБ |

Развёртывание: `sudo bash deploy/setup.sh`, затем `bash deploy/deploy.sh`.
Обновление кода: `bash deploy/deploy.sh --pull`.
