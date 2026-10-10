#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  KINOOX — развёртывание и обновление продакшна
#  Сервер: 95.216.97.185 · домен: kinoox.ru
#
#  Запуск: bash deploy/deploy.sh [--pull] [--no-cache] [--skip-backup]
# ─────────────────────────────────────────────────────────────

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${APP_DIR}/docker/docker-compose.yml"
ENV_FILE="${APP_DIR}/.env"
DOMAIN="kinoox.ru"
BACKUP_DIR="${APP_DIR}/storage/backups"

PULL=false
NO_CACHE=false
SKIP_BACKUP=false

for arg in "$@"; do
  case "${arg}" in
    --pull) PULL=true ;;
    --no-cache) NO_CACHE=true ;;
    --skip-backup) SKIP_BACKUP=true ;;
    *) echo "Неизвестный аргумент: ${arg}"; exit 1 ;;
  esac
done

log() { echo -e "\n\033[1;36m▶ $*\033[0m"; }
ok() { echo -e "\033[1;32m✔ $*\033[0m"; }
warn() { echo -e "\033[1;33m⚠ $*\033[0m"; }
fail() { echo -e "\033[1;31m✖ $*\033[0m" >&2; exit 1; }

# ── Проверки ─────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || fail "Docker не установлен. Запустите: sudo bash deploy/setup.sh"
[[ -f "${ENV_FILE}" ]] || fail "Не найден ${ENV_FILE}. Скопируйте .env.example в .env и заполните значения."
[[ -f "${COMPOSE_FILE}" ]] || fail "Не найден ${COMPOSE_FILE}"

# shellcheck disable=SC1090
set -a; source "${ENV_FILE}"; set +a

[[ -n "${DB_PASSWORD:-}" ]] || fail "В .env не задан DB_PASSWORD"

DC="docker compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE}"

# ── Обновление кода ──────────────────────────────────────────
if [[ "${PULL}" == true ]]; then
  log "Обновляем код из репозитория"
  cd "${APP_DIR}"
  git fetch --all --prune
  git pull --ff-only
  ok "Код обновлён: $(git rev-parse --short HEAD)"
fi

cd "${APP_DIR}"

# ── Резервная копия перед обновлением ───────────────────────
if [[ "${SKIP_BACKUP}" == false ]]; then
  log "Создаём резервную копию базы данных"
  mkdir -p "${BACKUP_DIR}"

  if ${DC} ps postgres --status running --quiet 2>/dev/null | grep -q .; then
    DUMP="${BACKUP_DIR}/pre-deploy_$(date +%Y%m%d_%H%M%S).dump"
    ${DC} exec -T postgres pg_dump -U "${DB_USER:-kinoox}" -d "${DB_NAME:-kinoox_db}" -Fc > "${DUMP}"
    ok "Дамп сохранён: $(basename "${DUMP}") ($(du -h "${DUMP}" | cut -f1))"
  else
    warn "PostgreSQL не запущен — пропускаем резервное копирование"
  fi
fi

# ── Сборка образов ───────────────────────────────────────────
log "Собираем образы приложения"
BUILD_ARGS=()
[[ "${NO_CACHE}" == true ]] && BUILD_ARGS+=(--no-cache)

${DC} build "${BUILD_ARGS[@]}" api web migrate
ok "Образы собраны"

# ── Запуск сервисов ──────────────────────────────────────────
log "Запускаем сервисы"
${DC} up -d --remove-orphans

# ── Ожидание готовности ──────────────────────────────────────
log "Ожидаем готовности сервисов"

wait_for() {
  local service="$1"
  local attempts="${2:-60}"
  local counter=0

  while [[ ${counter} -lt ${attempts} ]]; do
    local state
    state="$(docker inspect --format='{{.State.Health.Status}}' "kinoox-${service}" 2>/dev/null || echo 'starting')"
    if [[ "${state}" == "healthy" ]]; then
      ok "${service}: healthy"
      return 0
    fi
    counter=$((counter + 1))
    sleep 3
  done

  warn "${service}: не стал healthy за $((attempts * 3)) секунд"
  return 1
}

wait_for postgres 40 || fail "PostgreSQL не запустился"
wait_for redis 20 || warn "Redis не запустился — API будет работать без кэша"
wait_for api 60 || fail "API не запустился"
wait_for web 60 || fail "Сайт не запустился"
wait_for nginx 20 || warn "Nginx не прошёл healthcheck"

# ── Применение миграций ──────────────────────────────────────
log "Применяем миграции и seed"
${DC} run --rm migrate || warn "Миграции завершились с ошибкой — проверьте логи"

# ── Копирование статики Next.js ─────────────────────────────
log "Копируем статику Next.js в storage/static"
mkdir -p "${APP_DIR}/storage/static"
if ${DC} ps web --status running --quiet 2>/dev/null | grep -q .; then
  ${DC} cp web:/app/static "${APP_DIR}/storage/static/" 2>/dev/null && ok "Статика скопирована" || warn "Статика не скопирована — nginx отдаст 404"
else
  warn "Web-контейнер не запущен — пропускаем копирование статики"
fi

# ── SSL-сертификат ───────────────────────────────────────────
if [[ ! -f "${APP_DIR}/deploy/ssl/live/${DOMAIN}/fullchain.pem" ]]; then
  log "Выпускаем SSL-сертификат Let's Encrypt"
  ${DC} run --rm certbot || warn "Не удалось выпустить сертификат — проверьте DNS домена"
  ${DC} restart nginx
else
  ok "SSL-сертификат уже выпущен"
fi

# ── Проверка ─────────────────────────────────────────────────
log "Проверяем доступность"
sleep 5

HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' "https://${DOMAIN}/api/health" || echo '000')"
if [[ "${HTTP_CODE}" == "200" ]]; then
  ok "https://${DOMAIN}/api/health отвечает 200"
else
  warn "https://${DOMAIN}/api/health вернул ${HTTP_CODE}"
fi

echo ""
log "Состояние контейнеров"
${DC} ps --format 'table {{.Name}}\t{{.Status}}\t{{.Ports}}'

echo ""
log "Использование ресурсов"
docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}' \
  | grep kinoox || true

echo ""
ok "Развёртывание завершено: https://${DOMAIN}"
echo ""
echo "Полезные команды:"
echo "  Логи API:        ${DC} logs -f api"
echo "  Логи сайта:      ${DC} logs -f web"
echo "  Перезапуск API:  ${DC} restart api"
echo "  Остановка:       ${DC} down"
