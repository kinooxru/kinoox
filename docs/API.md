# API KINOOX

Базовый URL: `https://kinoox.ru/api/v1`
Healthcheck: `https://kinoox.ru/api/health`

Формат ответа всех эндпоинтов:

```json
{ "success": true, "data": {}, "error": null }
```

Ошибка:

```json
{ "success": false, "data": null, "error": "Текст ошибки" }
```

Авторизация: заголовок `Authorization: Bearer <accessToken>`.

---

## Каталог

### GET /titles

Параметры: `type`, `genre`, `country`, `year`, `minRating`, `sort`, `page`, `perPage`.

- `type`: `movie` | `serial` | `cartoon` | `anime`
- `sort`: `popular` | `rating` | `year` | `newest` (по умолчанию `popular`)
- `perPage`: 1–100 (по умолчанию 24)

Ответ:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "type": "movie",
        "title": "Матрица",
        "originalTitle": "The Matrix",
        "posterUrl": "https://…",
        "year": 1999,
        "ratingKp": 8.5,
        "genres": ["фантастика", "боевик"],
        "status": "released"
      }
    ],
    "meta": { "page": 1, "perPage": 24, "total": 120, "totalPages": 5 }
  },
  "error": null
}
```

### GET /titles/:id

Возвращает полный `TitleDTO` с описанием, актёрами, режиссёрами, числом серий
и количеством сезонов.

### GET /titles/:id/episodes

Массив `EpisodeDTO`: `id`, `titleId`, `season`, `episode`, `name`.

### GET /titles/:id/sources

Источники воспроизведения по приоритету. Параметры: `season`, `episode`,
`trailer` (`true` | `only`), `sync`, `poster`.

```json
{
  "success": true,
  "data": {
    "titleId": 1,
    "sources": [
      {
        "balancer": "vibix",
        "iframeUrl": "https://…",
        "quality": "1080p",
        "embedCode": "<ins data-publisher-id=\"…\" data-type=\"kp\" data-id=\"435\"></ins>",
        "episodes": [{ "name": "Сезон 1", "series": [{ "id": 1, "name": "Серия 1" }] }]
      }
    ],
    "primary": { "balancer": "vibix", "iframeUrl": "https://…", "quality": "1080p" }
  },
  "error": null
}
```

### GET /titles/:id/sources/:balancer

Источник конкретного балансера: `vibix` или `veoveo`. 404, если недоступен.

### GET /titles/:id/related, GET /titles/:id/similar

Похожие тайтлы и «сейчас смотрят». Параметр `limit` (1–48, по умолчанию 12).

### GET /filters

Доступные значения фильтров: `genres`, `years`, `countries`.

### GET /collections

Подборки главной страницы: `trending`, `newReleases`, `topRated`, `anime`.

### GET /players/balancers

Состояние балансеров: имя, приоритет, включён ли.

---

## Авторизация

### POST /auth/register

```json
{ "email": "user@example.com", "username": "kinoman", "password": "Secret123" }
```

Требования к паролю: минимум 8 символов, хотя бы одна буква и одна цифра.

Ответ 201:

```json
{
  "success": true,
  "data": {
    "user": { "id": 2, "email": "user@example.com", "username": "kinoman", "avatarUrl": null, "role": "user", "createdAt": "…" },
    "tokens": { "accessToken": "…", "refreshToken": "…", "expiresIn": 900 }
  },
  "error": null
}
```

### POST /auth/login

Тело: `{ "email": "…", "password": "…" }`. Ответ — тот же формат, что и у регистрации.

### POST /auth/refresh

Тело: `{ "refreshToken": "…" }`. Ответ — новая пара токенов. Старый
refresh-токен отзывается.

### POST /auth/logout

Требует авторизации. Отзывает refresh-токен.

Лимит: 10 попыток входа или регистрации за 5 минут на IP.

---

## Профиль и закладки

Все роуты требуют авторизации.

| Метод | Роут | Назначение |
|---|---|---|
| GET | `/user/profile` | Профиль текущего пользователя |
| PATCH | `/user/profile` | Изменить `username` или `avatarUrl` |
| GET | `/user/history` | История просмотров с пагинацией |
| POST | `/user/history` | Записать просмотр `{ titleId, season?, episode? }` |
| DELETE | `/user/history` | Очистить историю |
| GET | `/user/filters` | Жанры и годы из истории пользователя |
| GET | `/user/bookmarks` | Закладки, параметры `status`, `page`, `perPage` |
| GET | `/user/bookmarks/counters` | Счётчики по статусам |
| GET | `/user/bookmarks/:titleId/status` | Статус закладки для иконки «сердце» |
| POST | `/user/bookmarks` | Добавить `{ titleId, status?, lastSeason?, lastEpisode? }` |
| PATCH | `/user/bookmarks/:titleId` | Изменить статус или прогресс |
| DELETE | `/user/bookmarks/:titleId` | Удалить закладку |

Статусы закладок: `watching`, `planned`, `completed`, `dropped`, `on_hold`.

---

## Комментарии

| Метод | Роут | Доступ |
|---|---|---|
| GET | `/titles/:id/comments` | Публично |
| POST | `/titles/:id/comments` | Авторизация, до 30 в минуту |
| DELETE | `/comments/:id` | Автор или админ |
| POST | `/comments/:id/like` | Публично |

Тело создания: `{ "text": "…", "parentId": 12 }`. Ответы имеют один уровень
вложенности: ответ на ответ прикрепляется к корневому комментарию.

---

## Поиск

| Метод | Роут | Параметры |
|---|---|---|
| GET | `/search` | `q`, `type`, `page`, `perPage` |
| GET | `/search/suggest` | `q`, `limit` (до 24) |
| GET | `/search/trending` | `limit` (до 50) |
| GET | `/search/history` | авторизация |
| DELETE | `/search/history` | авторизация |

Поиск идёт по русскому названию, оригинальному названию и жанрам.

---

## Приложения

| Метод | Роут | Назначение |
|---|---|---|
| GET | `/downloads` | Все платформы: описание, ссылки, размер, требования, скриншоты |
| GET | `/downloads/changelog` | История версий, параметр `platform` |
| GET | `/downloads/:platform` | Последняя версия платформы |
| GET | `/downloads/:platform/versions` | Все версии платформы |
| POST | `/downloads/:platform/register` | Учесть скачивание |

Платформы: `android`, `ios`, `windows`, `macos`, `linux`.

---

## Уведомления

| Метод | Роут | Назначение |
|---|---|---|
| GET | `/notifications` | Список уведомлений |
| POST | `/notifications/read` | Отметить прочитанными `{ ids: [] }` |
| POST | `/notifications/subscribe` | Подписаться на новые серии `{ titleId }` |
| DELETE | `/notifications/subscribe/:titleId` | Отписаться |

---

## Администрирование

### POST /admin/titles

Только для роли `admin`. Создаёт или обновляет тайтл по `kpId` или `imdbId`.

```json
{
  "kpId": 435,
  "type": "movie",
  "title": "Матрица",
  "posterUrl": "https://…",
  "year": 1999,
  "genres": ["фантастика"],
  "countries": ["США"],
  "status": "released"
}
```

---

## Healthcheck

### GET /api/health

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptime": 3600,
    "version": "1.0.0",
    "services": { "database": "up", "redis": "up" },
    "timestamp": "2026-10-02T12:00:00.000Z"
  },
  "error": null
}
```

Возвращает 503, если PostgreSQL недоступен. Redis не критичен: без него
статус остаётся `ok`, а `services.redis` — `down`.

### GET /api/health/live

Короткий ответ `{ "status": "ok", "env": "production" }` без обращения к базе.

---

## Socket.io

Подключение: `ws://kinoox.ru/socket.io`, авторизация через `auth.token`.

Комнаты: `user:<id>`, `title:<id>`, `party:<roomId>`.

События сервер → клиент: `notification`, `new_episode`, `watch_party:sync`,
`watch_party:joined`.

События клиент → сервер: `title:subscribe`, `title:unsubscribe`,
`watch_party:join`, `watch_party:leave`, `watch_party:sync`.

---

## Роли и лимиты

| Роль | Возможности |
|---|---|
| Гость | Каталог, поиск, комментарии (чтение), страница загрузки |
| `user` | Всё выше + закладки, история, комментарии, уведомления |
| `admin` | Всё выше + управление тайтлами, удаление любых комментариев |

Лимиты запросов: 120 в минуту глобально, 10 попыток входа за 5 минут,
30 комментариев в минуту, 10 скачиваний сборок в секунду.
