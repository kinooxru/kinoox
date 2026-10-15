# Развёртывание KINOOX

## Требования к серверу

| Параметр | Значение |
|---|---|
| CPU | Intel Core i7-6700 (4 ядра / 8 потоков) |
| RAM | 64 ГБ |
| Диск | 2×512 ГБ SSD |
| ОС | Debian 12 (Bookworm) |
| IP | 95.216.97.185 |
| Домен | kinoox.ru |

DNS: `A`-записи `kinoox.ru` и `www.kinoox.ru` должны указывать на IP сервера
до первого запуска — иначе Let's Encrypt не выпустит сертификат.

## Первичная настройка сервера

```bash
ssh root@95.216.97.185
git clone <репозиторий> /opt/kinoox
cd /opt/kinoox
sudo bash deploy/setup.sh
```

Скрипт `setup.sh` делает:

1. Проверяет ОС и обновляет пакеты.
2. Устанавливает часовой пояс Europe/Moscow и синхронизацию времени (chrony).
3. Создаёт swap 4 ГБ и настраивает параметры ядра под нагрузку
   (`somaxconn`, `tcp_congestion_control=bbr`, лимиты файлов).
4. Устанавливает Docker и Compose, настраивает демон (лимиты логов 50 МБ × 5,
   ulimits `nofile 65536`, `nproc 4096`, `live-restore`).
5. Настраивает UFW: открыты 22 (SSH), 80 (HTTP), 443 (HTTPS), 9090 (Cockpit).
6. Настраивает fail2ban для SSH.
7. Создаёт каталоги `storage/downloads`, `storage/backups`, `deploy/ssl`.
8. Устанавливает Cockpit для мониторинга.

## Настройка окружения

```bash
cd /opt/kinoox
cp .env.example .env
nano .env
```

Обязательно заполнить:

| Переменная | Описание |
|---|---|
| `DB_PASSWORD` | Пароль PostgreSQL, минимум 32 символа |
| `JWT_ACCESS_SECRET` | Секрет access-токенов, минимум 32 символа |
| `JWT_REFRESH_SECRET` | Секрет refresh-токенов, другой, минимум 32 символа |
| `MINIO_ROOT_PASSWORD` | Пароль MinIO |
| `GRAFANA_ADMIN_PASSWORD` | Пароль администратора Grafana |
| `VIBIX_API_KEY` | Ключ партнёра Vibix (`<publisher_id>\|<token>`) |
| `VEOVEO_API_TOKEN` | Токен VeoVeo из личного кабинета |
| `PLAYERS_MODE` | `real` в продакшне, `mock` для разработки |

Секреты можно сгенерировать так:

```bash
openssl rand -base64 48
```

## Развёртывание

```bash
bash deploy/deploy.sh
```

Скрипт:

1. Делает дамп базы перед обновлением (если она уже запущена).
2. Собирает образы `api`, `web`, `migrate`.
3. Поднимает сервисы через `docker compose up -d --remove-orphans`.
4. Ждёт перехода healthcheck'ов в состояние `healthy`.
5. Применяет миграции Prisma и seed.
6. Выпускает SSL-сертификат Let's Encrypt, если его ещё нет.
7. Проверяет `https://kinoox.ru/api/health` и печатает состояние контейнеров.

Флаги:

| Флаг | Действие |
|---|---|
| `--pull` | Обновить код из git перед сборкой |
| `--no-cache` | Собрать образы без кэша слоёв |
| `--skip-backup` | Пропустить резервное копирование |

Обновление продакшна:

```bash
cd /opt/kinoox && bash deploy/deploy.sh --pull
```

## Сервисы

Всего 20 контейнеров:

| # | Сервис | Назначение | Сеть | Память |
|---|---|---|---|---|
| 1 | postgres | PostgreSQL 16 | backend (internal) | 32 ГБ |
| 2 | redis | Кэш и сессии | backend (internal) | 4 ГБ |
| 3 | migrate | Миграции и seed (one-shot) | backend | — |
| 4 | api | Fastify-бэкенд | backend + frontend | 8 ГБ |
| 5 | web | Next.js SSR | frontend | 8 ГБ |
| 6 | nginx | Reverse proxy, SSL, статика | frontend + monitoring | — |
| 7 | certbot | Первичный выпуск SSL | frontend | — |
| 8 | certbot-renewer | Автообновление SSL (03:00) | frontend | — |
| 9 | pg-backup | Дамп БД (02:00, хранение 30 дней) | backend | — |
| 10 | minio | S3-хранилище сборок | frontend + backend | 2 ГБ |
| 11 | minio-init | Создание buckets (one-shot) | backend | — |
| 12 | adminer | Веб-интерфейс БД | backend + frontend | 256 МБ |
| 13 | watchtower | Автообновление образов | monitoring | — |
| 14 | prometheus | Метрики (30 дней / 10 ГБ) | monitoring + backend | 2 ГБ |
| 15 | grafana | Дашборды | monitoring + frontend | 1 ГБ |
| 16 | node-exporter | Метрики хоста | monitoring | — |
| 17 | cadvisor | Метрики контейнеров | monitoring | 1 ГБ |
| 18 | alertmanager | Алерты | monitoring | 256 МБ |
| 19 | loki | Агрегация логов | monitoring | 2 ГБ |
| 20 | promtail | Сбор логов Docker | monitoring | 512 МБ |

Суммарный лимит памяти — около 61,5 ГБ из 64 ГБ.

## Доступ к административным интерфейсам

Все админ-интерфейсы доступны только с localhost и из внутренней сети
Docker, наружу закрыты в Nginx:

| Интерфейс | URL | Доступ |
|---|---|---|
| Grafana | `https://kinoox.ru/grafana/` | 127.0.0.1, 172.20.0.0/16 |
| Prometheus | `https://kinoox.ru/prometheus/` | 127.0.0.1, 172.20.0.0/16 |
| Alertmanager | `https://kinoox.ru/alertmanager/` | 127.0.0.1, 172.20.0.0/16 |
| Adminer | `https://kinoox.ru/adminer/` | 127.0.0.1, 172.20.0.0/16 |
| Cockpit | `https://95.216.97.185:9090` | UFW, порт 9090 |

Для доступа извне используйте SSH-туннель:

```bash
ssh -L 3000:localhost:3000 root@95.216.97.185
# затем откройте http://localhost:3000
```

## Файлы сборок приложений

Сборки хранятся в `/opt/kinoox/storage/downloads/`:

```
storage/downloads/
├── android/kinoox-1.0.0.apk
├── ios/kinoox-1.0.0.ipa
├── windows/kinoox-1.0.0.exe
├── windows/kinoox-1.0.0.msi
├── macos/kinoox-1.0.0.dmg
├── linux/kinoox-1.0.0.AppImage
├── linux/kinoox-1.0.0.deb
├── linux/kinoox-1.0.0.rpm
└── updates/          # артефакты автообновления Tauri
```

Nginx отдаёт их по адресу `https://kinoox.ru/downloads/...` со правильными
`Content-Type` и заголовком `Content-Disposition: attachment`.

## Резервное копирование

- **Ежедневный дамп** — контейнер `pg-backup`, 02:00, формат `pg_dump -Fc`,
  хранение 30 дней в `/opt/kinoox/storage/backups/`.
- **WAL-архив** — `archive_mode=on`, копии WAL в `storage/backups/wal_archive/`
  для восстановления на произвольный момент (PITR).

Восстановление из дампа:

```bash
cd /opt/kinoox
docker compose -f docker/docker-compose.yml exec -T postgres \
  pg_restore -U kinoox -d kinoox_db --clean --if-exists < storage/backups/kinoox_20261002_0200.dump
```

## Мониторинг

Prometheus собирает метрики с API, node-exporter и cAdvisor. Правила алертов
в `docker/prometheus/alert_rules.yml` покрывают:

- недоступность API, сайта, Nginx;
- загрузку CPU выше 85% и памяти выше 90%;
- свободное место на диске менее 15% и прогноз заполнения за 24 часа;
- приближение контейнеров к лимиту памяти и частые перезапуски;
- рост ошибок 5xx и медленные ответы (p95 > 3 с);
- истечение SSL-сертификата и отсутствие свежего бэкапа.

Алерты маршрутизируются в Alertmanager: критичные — сразу на почту
администратора, предупреждения — с задержкой.

Логи всех контейнеров собирает Promtail и отправляет в Loki (ретенция 30 дней).
В Grafana настроены datasource'ы Prometheus и Loki с автозагрузкой дашбордов.

## Диагностика

```bash
cd /opt/kinoox
DC="docker compose -f docker/docker-compose.yml"

# Состояние сервисов
$DC ps

# Логи
$DC logs -f api
$DC logs -f web
$DC logs --tail 200 nginx

# Использование ресурсов
docker stats --no-stream

# Проверка API
curl -s https://kinoox.ru/api/health | jq

# Проверка кэша Nginx
curl -sI https://kinoox.ru/api/v1/titles | grep -i x-cache

# Перезапуск сервиса
$DC restart api

# Полная остановка (данные в томах сохраняются)
$DC down
```

## Типовые проблемы

**Nginx не стартует, «cannot load certificate»** — сертификат ещё не выпущен.
Запустите `$DC run --rm certbot` и перезапустите Nginx.

**API не проходит healthcheck** — проверьте подключение к PostgreSQL:
`$DC logs api | grep -i postgres`. Если база ещё инициализируется, подождите
и повторите `$DC restart api`.

**Миграции не применились** — контейнер `migrate` запускается один раз;
запустите вручную: `$DC run --rm migrate`.

**Сборка сайта падает на создании симлинков (Windows)** — это ограничение
прав Windows; `BUILD_STANDALONE=true` нужен только для Docker-образа.

**Закончилось место на диске** — очистите старые образы и логи:
`docker system prune -af --volumes=false` и проверьте `storage/backups`.

## Обновление

Обновление подхватывается автоматически через Watchtower (раз в сутки,
только контейнеры с меткой `com.centurylinklabs.watchtower.enable=true`).
Для собственных образов `api` и `web` используйте GitHub Actions
(`deploy-api.yml`, `deploy-web.yml`) или ручной запуск:

```bash
cd /opt/kinoox && bash deploy/deploy.sh --pull
```