# KINOOX

Онлайн-кинотеатр нового поколения: сайт, API, нативные мобильные и десктопные приложения.
**DLE, WordPress и любые CMS не используются. PWA не используется. Всё написано с нуля.**

Слоган: «Смотри. Чувствуй. Погружайся.»

## Структура

```
apps/
  web/       Next.js 14+ (App Router) — сайт
  api/       Fastify + Prisma + Redis — бэкенд
  mobile/    React Native + Expo — Android и iOS
  desktop/   Tauri 2 (Rust + WebView) — Windows, macOS, Linux
packages/
  design-system/  Токены и UI-компоненты «Cinematic Flow»
  api-client/     Типизированный HTTP-клиент и DTO
docker/           docker-compose, nginx, prometheus, grafana, loki
deploy/           скрипты развёртывания
```

## Быстрый старт

```bash
pnpm install
cp .env.example .env
pnpm --filter @kinoox/api db:generate
pnpm --filter @kinoox/api db:migrate
pnpm --filter @kinoox/api db:seed
pnpm dev
```

- Сайт: http://localhost:3000
- API: http://localhost:3001/api/v1
- Health: http://localhost:3001/api/health

Без запущенного PostgreSQL API стартует и отдаёт `/api/health` со статусом
`degraded`; Redis необязателен — без него кэш отключается, а сервис продолжает работать.

Для разработки без реальных балансеров установите `PLAYERS_MODE=mock`.

## Команды

```bash
pnpm build            # сборка всех пакетов
pnpm typecheck        # проверка типов во всех пакетах
pnpm dev              # запуск сайта и API параллельно
pnpm db:seed          # наполнение базы
pnpm docker:up        # подъём всего стека в Docker
```

## Что реализовано

**Сайт** — 20 маршрутов: главная с подборками, четыре раздела каталога с
фильтрами и пагинацией, страница тайтла с плеером и комментариями, поиск
с живыми подсказками, вход и регистрация, профиль, закладки, история,
страница загрузки приложений со всеми секциями, поддержка и документы.

**API** — 10 модулей (titles, auth, users, bookmarks, comments, search,
players, downloads, notifications, health), единый конверт ответа
`{ success, data, error }`, JWT с обновлением токенов, кэш Redis,
Socket.io, rate limiting, Prisma-схема с 9 моделями.

**Балансеры** — Vibix и VeoVeo реализуют общий интерфейс, оркестратор
перебирает их по приоритету; при `PLAYERS_MODE=mock` работают заглушки.

**Мобильные приложения** — React Native + Expo: 8 экранов, стеклянный
таб-бар, полноэкранный плеер с жестами, офлайн-каталог, push-уведомления.

**Десктопные приложения** — Tauri 2: frameless-окно, системный трей,
мини-плеер поверх окон, глобальные горячие клавиши, автозапуск,
автообновление. Размер 5–10 МБ вместо 80+ МБ у Electron.

**Дизайн-система** — «Cinematic Flow»: своя палитра, градиентные акценты,
tri-шрифтовая типографика, 20 компонентов, единая кривая анимации.

**Инфраструктура** — 20 Docker-сервисов, Nginx с SSL и кэшем, мониторинг
(Prometheus, Grafana, Alertmanager), логирование (Loki, Promtail),
бэкапы с WAL-архивом, 4 workflow GitHub Actions.

## Документация

| Файл | Содержание |
|---|---|
| `docs/ARCHITECTURE.md` | Архитектура, схема сервисов, кэширование |
| `docs/API.md` | Полное описание эндпоинтов и форматов |
| `docs/DESIGN-SYSTEM.md` | Токены, анимации, компоненты |
| `docs/APPS.md` | Мобильные и десктопные приложения, CI/CD |
| `docs/DEPLOYMENT.md` | Развёртывание, мониторинг, диагностика |
| `doc/KINOOX/промп-план.txt` | Исходный план проекта |
| `doc/VIBIX/`, `doc/VEOVEO/` | Документация балансеров |

## Продакшн

```bash
sudo bash deploy/setup.sh     # первичная настройка сервера
cp .env.example .env && nano .env
bash deploy/deploy.sh         # развёртывание
bash deploy/deploy.sh --pull  # обновление
```

Сервер: Debian 12, IP `95.216.97.185`, домен `kinoox.ru`.
Администрирование — только с localhost через SSH-туннель или из внутренней
сети Docker.
