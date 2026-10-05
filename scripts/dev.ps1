#!/usr/bin/env pwsh
# ─────────────────────────────────────────────────────────────
#  KINOOX — запуск локального окружения разработки
#
#  Что делает:
#   1. поднимает portable PostgreSQL из .tools (порт 5433);
#   2. запускает API (Fastify) на порту 3001;
#   3. запускает сайт (Next.js) на порту 3000.
#
#  Запуск:  pwsh -File scripts/dev.ps1
#  Стоп:    pwsh -File scripts/dev.ps1 -Stop
# ─────────────────────────────────────────────────────────────

param(
    [switch]$Stop,
    [switch]$SkipPg
)

$ErrorActionPreference = 'Continue'

$Root = Split-Path -Parent $PSScriptRoot
$NodeDir = Join-Path $Root '.tools\node\node-v24.21.0-win-x64'
$PgBin = Join-Path $Root '.tools\pg\pgsql\bin'
$PgData = Join-Path $Root '.tools\pgdata'
$PgLog = Join-Path $Root '.tools\pg.log'

$env:PATH = "$NodeDir;$PgBin;$env:PATH"
$env:DATABASE_URL = 'postgresql://kinoox:kinoox_local_dev_password@localhost:5433/kinoox_db?schema=public'
$env:REDIS_URL = 'redis://localhost:6379'
$env:PLAYERS_MODE = 'mock'
$env:NEXT_PUBLIC_API_URL = 'http://localhost:3001/api/v1'
$env:NEXT_PUBLIC_SOCKET_URL = 'http://localhost:3001'
$env:NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'

function Write-Step($text) { Write-Host "`n> $text" -ForegroundColor Cyan }
function Write-Ok($text) { Write-Host "  OK $text" -ForegroundColor Green }
function Write-Warn($text) { Write-Host "  ! $text" -ForegroundColor Yellow }

if ($Stop) {
    Write-Step 'Останавливаем приложение'
    Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
        Where-Object { $_.CommandLine -match 'kinoox|next|tsx' } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    Write-Ok 'Node-процессы остановлены'

    if (Test-Path $PgBin) {
        & "$PgBin\pg_ctl.exe" -D $PgData stop -m fast 2>&1 | Out-Null
        Write-Ok 'PostgreSQL остановлен'
    }
    exit 0
}

# ── 1. PostgreSQL ──────────────────────────────────────────────
if (-not $SkipPg) {
    Write-Step 'Запускаем PostgreSQL (порт 5433)'

    $running = & "$PgBin\pg_ctl.exe" -D $PgData status 2>&1 | Out-String
    if ($running -match 'server is running') {
        Write-Ok 'PostgreSQL уже запущен'
    } else {
        & "$PgBin\pg_ctl.exe" -D $PgData -o '-p 5433' -l $PgLog start 2>&1 | Out-Null
        Start-Sleep -Seconds 5
        Write-Ok 'PostgreSQL запущен'
    }
}

# ── 2. API ────────────────────────────────────────────────────
Write-Step 'Запускаем API (http://localhost:3001)'
Start-Process -FilePath "$NodeDir\node.exe" `
    -ArgumentList "`"$Root\apps\api\node_modules\tsx\dist\cli.mjs`" watch src/server.ts" `
    -WorkingDirectory "$Root\apps\api" `
    -WindowStyle Hidden `
    -RedirectStandardOutput "$Root\.tools\api.log" `
    -RedirectStandardError "$Root\.tools\api.err.log"

Start-Sleep -Seconds 12

try {
    $health = Invoke-RestMethod -Uri 'http://localhost:3001/api/health' -TimeoutSec 10
    Write-Ok "API отвечает: status=$($health.data.status), БД=$($health.data.services.database)"
} catch {
    Write-Warn "API ещё поднимается: $($_.Exception.Message)"
}

# ── 3. Сайт ───────────────────────────────────────────────────
Write-Step 'Запускаем сайт (http://localhost:3000)'
Start-Process -FilePath "$NodeDir\node.exe" `
    -ArgumentList "`"$Root\apps\web\node_modules\next\dist\bin\next`" dev -p 3000" `
    -WorkingDirectory "$Root\apps\web" `
    -WindowStyle Hidden `
    -RedirectStandardOutput "$Root\.tools\web.log" `
    -RedirectStandardError "$Root\.tools\web.err.log"

Write-Host ''
Write-Host 'KINOOX запускается:' -ForegroundColor Green
Write-Host '  Сайт:  http://localhost:3000'
Write-Host '  API:   http://localhost:3001/api/v1'
Write-Host '  Health: http://localhost:3001/api/health'
Write-Host ''
Write-Host 'Логи:  .tools\api.log, .tools\web.log'
Write-Host 'Стоп:  pwsh -File scripts/dev.ps1 -Stop'