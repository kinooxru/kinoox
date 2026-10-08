# ─────────────────────────────────────────────────────────────
#  KINOOX — Скрипт деплоя на сервер
#  Запуск: powershell -ExecutionPolicy Bypass -File deploy-to-server.ps1
# ─────────────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"
$SERVER_IP = "95.216.97.185"
$SERVER_USER = "root"
$REMOTE_PATH = "/opt/kinoox"
$LOCAL_PATH = $PSScriptRoot

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  KINOOX Deploy to Server" -ForegroundColor Cyan
Write-Host "  Server: ${SERVER_USER}@${SERVER_IP}" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Проверка наличия .env файла
if (-not (Test-Path ".env")) {
    Write-Host "❌ ОШИБКА: Файл .env не найден!" -ForegroundColor Red
    Write-Host "Создайте .env файл из .env.example и заполните секреты.`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Файл .env найден" -ForegroundColor Green
Write-Host "📦 Начало деплоя...`n" -ForegroundColor Yellow

# Шаг 1: Проверка Git
Write-Host "🔍 Шаг 1: Проверка Git..." -ForegroundColor Cyan
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  Обнаружены несохранённые изменения" -ForegroundColor Yellow
    $confirm = Read-Host "Коммитить и пушить изменения? (y/n)"
    if ($confirm -eq 'y') {
        Write-Host "📝 Коммит изменений..." -ForegroundColor Cyan
        git add .
        git commit -m "chore: prepare deployment"
        Write-Host "📤 Push на GitHub..." -ForegroundColor Cyan
        git push origin main
        Write-Host "📤 Push на Gitverse..." -ForegroundColor Cyan
        git push gitverse main
        Write-Host "✅ Код обновлён в репозиториях`n" -ForegroundColor Green
    } else {
        Write-Host "⏭️  Пропуск git операций`n" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Git чист, изменения есть`n" -ForegroundColor Green
}

# Шаг 2: Копирование проекта через git
Write-Host "🔍 Шаг 2: Клонирование/обновление на сервере..." -ForegroundColor Cyan
Write-Host "Выполните на сервере:" -ForegroundColor White
Write-Host ""
Write-Host "  ssh ${SERVER_USER}@${SERVER_IP}" -ForegroundColor Yellow
Write-Host "  cd ${REMOTE_PATH}" -ForegroundColor Yellow
Write-Host "  git pull origin main" -ForegroundColor Yellow
Write-Host ""

# Шаг 3: Копирование .env файла
Write-Host "🔍 Шаг 3: Копирование .env файла..." -ForegroundColor Cyan

# Создаём временный файл для scp
$tempEnv = "$env:TEMP\kinoox-env-transfer.txt"
Copy-Item ".env" -Destination $tempEnv -Force

Write-Host "📤 Копирование .env на сервер..." -ForegroundColor Cyan
try {
    scp $tempEnv "${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/.env"
    Write-Host "✅ .env скопирован на сервер" -ForegroundColor Green
} catch {
    Write-Host "⚠️  SCP не доступен. Скопируйте .env вручную:" -ForegroundColor Yellow
    Write-Host "   Файл: $tempEnv" -ForegroundColor White
    Write-Host "   Путь на сервере: ${REMOTE_PATH}/.env" -ForegroundColor White
}

Remove-Item $tempEnv -Force -ErrorAction SilentlyContinue

# Шаг 4: Создание структуры каталогов на сервере
Write-Host "`n🔍 Шаг 4: Подготовка команд для сервера..." -ForegroundColor Cyan

$commands = @'
# Создание структуры каталогов
mkdir -p storage/downloads/updates
mkdir -p storage/backups/wal_archive
mkdir -p storage/screenshots
mkdir -p deploy/ssl
mkdir -p deploy/ssl-www
mkdir -p logs

# Установка прав
chmod -R 755 storage
chmod 700 deploy/ssl
'@

Write-Host $commands -ForegroundColor White
Write-Host ""

# Шаг 5: Инструкции по запуску
Write-Host "🔍 Шаг 5: Финальные команды на сервере..." -ForegroundColor Cyan

$finalCommands = @'
# Первичная настройка сервера (только если сервер новый)
sudo bash deploy/setup.sh

# Развёртывание приложения
bash deploy/deploy.sh

# Проверка статуса
docker compose -f docker/docker-compose.yml ps

# Проверка API
curl -s https://kinoox.ru/api/health | jq
'@

Write-Host $finalCommands -ForegroundColor White
Write-Host ""

# Итоговая инструкция
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ПОСЛЕДОВАТЕЛЬНОСТЬ ДЕЙСТВИЙ" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "1️⃣  Подключитесь к серверу:" -ForegroundColor Yellow
Write-Host "   ssh ${SERVER_USER}@${SERVER_IP}`n" -ForegroundColor White

Write-Host "2️⃣  Клонируйте репозиторий (если ещё не клонирован):" -ForegroundColor Yellow
Write-Host "   cd /opt" -ForegroundColor White
Write-Host "   git clone https://github.com/kinooxru/kinoox.git kinoox" -ForegroundColor White
Write-Host "   cd kinoox`n" -ForegroundColor White

Write-Host "3️⃣  Убедитесь, что .env файл на месте:" -ForegroundColor Yellow
Write-Host "   cat .env | head -5`n" -ForegroundColor White

Write-Host "4️⃣  Запустите настройку сервера (первый раз):" -ForegroundColor Yellow
Write-Host "   sudo bash deploy/setup.sh`n" -ForegroundColor White

Write-Host "5️⃣  Запустите деплой приложения:" -ForegroundColor Yellow
Write-Host "   bash deploy/deploy.sh`n" -ForegroundColor White

Write-Host "6️⃣  Дождитесь завершения (~10-15 минут)" -ForegroundColor Yellow
Write-Host "   Проверка: docker compose ps`n" -ForegroundColor White

Write-Host "7️⃣  Откройте сайт: https://kinoox.ru`n" -ForegroundColor Green

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Готово! Следуйте инструкциям выше." -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📄 Полная инструкция: DEPLOY-INSTRUCTIONS.md`n" -ForegroundColor Gray
