# ─────────────────────────────────────────────────────────────
#  KINOOX — PowerShell скрипт для настройки GitHub + GitVerse
#  Запуск: powershell -ExecutionPolicy Bypass -File setup-repos.ps1
# ─────────────────────────────────────────────────────────────

param(
    [string]$GitHubUser,
    [string]$GitVerseUser,
    [string]$GitName,
    [string]$GitEmail,
    [switch]$SkipGitVerse
)

# ── Цвета для вывода ──
$Green = "[OK]" -ForegroundColor Green
$Red = "[ERROR]" -ForegroundColor Red
$Yellow = "[WARN]" -ForegroundColor Yellow
$Info = "[INFO]" -ForegroundColor Cyan
$Reset = "Reset" -ForegroundColor Default

function Write-OK { Write-Host $Green $args -ForegroundColor Green }
function Write-Err { Write-Host $Red $args -ForegroundColor Red }
function Write-Warn { Write-Host $Yellow $args -ForegroundColor Yellow }
function Write-Info { Write-Host $Info $args -ForegroundColor Cyan }

# ── Проверка Git ──
Write-Info "Проверка Git..."
$gitPath = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitPath) {
    Write-Err "Git не найден! Установите с https://git-scm.com/download/win"
    exit 1
}
Write-OK "Git найден: $($gitPath.Version)"

# ── Проверка GitHub CLI ──
Write-Info "Проверка GitHub CLI..."
$ghPath = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghPath) {
    Write-Warn "GitHub CLI не найден. Скачайте с https://cli.github.com/"
    Write-Info "Без gh secrets придётся добавлять вручную через веб-интерфейс"
    $useGH = $false
} else {
    Write-OK "GitHub CLI найден: $(gh --version)"
    Write-Info "Проверка авторизации GitHub..."
    gh auth status 2>$null
    if ($LASTEXITCODE -eq 0) {
        $useGH = $true
        Write-OK "Авторизованы в GitHub"
    } else {
        Write-Warn "Не авторизованы в GitHub. Выполните: gh auth login"
        $useGH = $false
    }
}

# ── Ввод данных если не переданы ──
if (-not $GitHubUser) {
    $GitHubUser = Read-Host "Введите ваш GitHub username"
}
if (-not $SkipGitVerse -and -not $GitVerseUser) {
    $GitVerseUser = Read-Host "Введите ваш GitVerse username (Enter = пропустить)"
}
if (-not $GitName) {
    $GitName = Read-Host "Ваше имя для коммитов"
}
if (-not $GitEmail) {
    $GitEmail = Read-Host "Ваш email для коммитов"
}

# ── Настройка Git ──
Write-Info "Настройка Git..."
git config --global user.name $GitName
git config --global user.email $GitEmail
git config --global init.defaultBranch main
Write-OK "Настроены user.name, user.email, init.defaultBranch"

# ── Инициализация репозитория ──
Write-Info "Инициализация git-репозитория..."
if (-not (Test-Path ".git")) {
    git init
    Write-OK "Репозиторий инициализирован"
} else {
    Write-Info "Репозиторий уже инициализирован"
}

# ── Добавление remote origin (GitHub) ──
Write-Info "Добавление GitHub remote (origin)..."
$githubUrl = "https://github.com/$GitHubUser/kinoox.git"
git remote remove origin 2>$null
git remote add origin $githubUrl
Write-OK "origin -> $githubUrl"

# ── Добавление remote gitverse ──
if (-not $SkipGitVerse -and $GitVerseUser) {
    Write-Info "Добавление GitVerse remote (gitverse)..."
    $gitverseUrl = "https://gitverse.ru/$GitVerseUser/kinoox.git"
    git remote remove gitverse 2>$null
    git remote add gitverse $gitverseUrl
    Write-OK "gitverse -> $gitverseUrl"
} else {
    Write-Info "GitVerse пропущен"
}

# ── Проверка remote ──
Write-Info "Текущие remote-репозитории:"
git remote -v

# ── Создание директории для инструментов ──
Write-Info "Создание директории .tools..."
if (-not (Test-Path ".tools")) {
    New-Item -ItemType Directory -Path ".tools" -Force | Out-Null
    Write-OK "Создана папка .tools/"
}

# ── Создание SSH-ключа для деплоя (если нет) ──
Write-Info "Проверка SSH-ключа для деплоя..."
$deployKeyPath = ".tools/deploy-key"
$deployKeyPubPath = ".tools/deploy-key.pub"

if (-not (Test-Path $deployKeyPath) -and (Test-Command ssh-keygen)) {
    Write-Info "Генерация SSH-ключа для деплоя..."
    ssh-keygen -t ed25519 -C "kinoox-deploy@$(Get-Date -Format 'yyyy-MM-dd')" -f $deployKeyPath -N "" -q
    Write-OK "SSH-ключ создан: $deployKeyPath"
    Write-Info "Публичный ключ: $deployKeyPubPath"
    Write-Info "Добавьте публичный ключ на сервер:"
    Write-Info "  ssh-copy-id -i $deployKeyPubPath root@95.216.97.185"
} elseif (Test-Path $deployKeyPath) {
    Write-OK "SSH-ключ уже существует"
} else {
    Write-Warn "ssh-keygen не найден. Сгенерируйте ключ вручную:"
    Write-Info "  ssh-keygen -t ed25519 -C 'kinoox-deploy' -f .tools/deploy-key -N ''"
}

# ── Функция проверки команды ──
function Test-Command {
    param([string]$Name)
    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

# ── Подготовка списка secrets ──
Write-Info "Подготовка списка secrets..."
$secretsList = @()
$secretsList += "=== БАЗОВЫЕ (3) ==="
$secretsList += "SERVER_IP = 95.216.97.185"
$secretsList += "SERVER_USER = root"
$secretsList += "SSH_PRIVATE_KEY = <содержимое .tools/deploy-key>"
$secretsList += ""
$secretsList += "=== МОБИЛЬНЫЕ (8) ==="
$secretsList += "EXPO_TOKEN = <expo-token>"
$secretsList += "ANDROID_KEYSTORE_BASE64 = <base64>"
$secretsList += "ANDROID_KEYSTORE_PASSWORD = <password>"
$secretsList += "ANDROID_KEY_ALIAS = <alias>"
$secretsList += "ANDROID_KEY_PASSWORD = <password>"
$secretsList += "IOS_DIST_CERT_BASE64 = <base64>"
$secretsList += "IOS_PROVISIONING_PROFILE_BASE64 = <base64>"
$secretsList += "IOS_DIST_CERT_PASSWORD = <password>"
$secretsList += "APPLE_ID = <email>"
$secretsList += "APPLE_APP_SPECIFIC_PASSWORD = <xxxx-xxxx-xxxx>"
$secretsList += ""
$secretsList += "=== ДЕСКТОПНЫЕ (10) ==="
$secretsList += "TAURI_SIGNING_PRIVATE_KEY = <key>"
$secretsList += "TAURI_SIGNING_PRIVATE_KEY_PASSWORD = <password>"
$secretsList += "WINDOWS_CERTIFICATE = <base64> (опционально)"
$secretsList += "WINDOWS_CERTIFICATE_PASSWORD = <password>"
$secretsList += "APPLE_CERTIFICATE = <base64>"
$secretsList += "APPLE_CERTIFICATE_PASSWORD = <password>"
$secretsList += "APPLE_SIGNING_IDENTITY = <identity>"
$secretsList += "APPLE_TEAM_ID = <team-id>"

$secretsPath = ".tools/github-secrets-list.txt"
$secretsList | Out-File -FilePath $secretsPath -Encoding utf8
Write-OK "Список secrets сохранён: $secretsPath"

# ── Итоговая информация ──
Write-Host ""
Write-Host "========================================" -ForegroundColor White
Write-Host "  Настройка завершена!" -ForegroundColor White
Write-Host "========================================" -ForegroundColor White
Write-Host ""
Write-Host "Следующие шаги:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Проверить файлы:" -ForegroundColor Yellow
Write-Host "   git status" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Создать первый коммит:" -ForegroundColor Yellow
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m `"feat: initial commit`"" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Отправить на GitHub:" -ForegroundColor Yellow
Write-Host "   git branch -M main" -ForegroundColor Gray
Write-Host "   git push -u origin main" -ForegroundColor Gray
if (-not $SkipGitVerse -and $GitVerseUser) {
    Write-Host ""
    Write-Host "4. Отправить на GitVerse:" -ForegroundColor Yellow
    Write-Host "   git push gitverse main" -ForegroundColor Gray
}
Write-Host ""
Write-Host "5. Добавить Secrets:" -ForegroundColor Yellow
Write-Host "   GitHub: https://github.com/$GitHubUser/kinoox/settings/secrets/actions" -ForegroundColor Gray
if (-not $SkipGitVerse -and $GitVerseUser) {
    Write-Host "   GitVerse: Settings → Secrets → Actions" -ForegroundColor Gray
}
Write-Host ""
Write-Host "Полный список secrets: .tools/github-secrets-list.txt" -ForegroundColor Gray
Write-Host "Подробная инструкция: GITHUB-SETUP.md" -ForegroundColor Gray
Write-Host "Список secrets: GITHUB-SECRETS.md" -ForegroundColor Gray
Write-Host ""
