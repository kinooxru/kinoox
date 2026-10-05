@echo off
REM ─────────────────────────────────────────────────────────────
REM  KINOOX — Скрипт быстрой настройки Git-репозитория
REM  Запуск: setup-git.bat
REM ─────────────────────────────────────────────────────────────

echo.
echo ========================================
echo   KINOOX Git Setup
echo ========================================
echo.

REM Проверка Git
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git не найден в PATH!
    echo Установите Git с https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [OK] Git найден:
git --version
echo.

REM Ввод данных
set /p GITHUB_USER="Введите ваш GitHub username: "
set /p GITVERSE_USER="Введите ваш GitVerse username (или Enter = пропустить): "
set /p GIT_NAME="Ваше имя для коммитов (например: Ivan Petrov): "
set /p GIT_EMAIL="Ваш email для коммитов: "

echo.
echo [INFO] Настройка Git...
echo.

REM Глобальные настройки
git config --global user.name "%GIT_NAME%"
git config --global user.email "%GIT_EMAIL%"
git config --global init.defaultBranch main

echo [OK] Настроены user.name и user.email
echo.

REM Инициализация репозитория
if not exist ".git" (
    echo [INFO] Инициализация git-репозитория...
    git init
    echo [OK] Репозиторий инициализирован
) else (
    echo [INFO] Репозиторий уже инициализирован
)
echo.

REM Добавление GitHub remote
echo [INFO] Добавление GitHub remote (origin)...
git remote remove origin 2>nul
git remote add origin https://github.com/%GITHUB_USER%/kinoox.git
echo [OK] origin -> https://github.com/%GITHUB_USER%/kinoox.git
echo.

REM Добавление GitVerse remote (если указан)
if not "%GITVERSE_USER%"=="" (
    echo [INFO] Добавление GitVerse remote (gitverse)...
    git remote remove gitverse 2>nul
    git remote add gitverse https://gitverse.ru/%GITVERSE_USER%/kinoox.git
    echo [OK] gitverse -> https://gitverse.ru/%GITVERSE_USER%/kinoox.git
    echo.
) else (
    echo [SKIP] GitVerse пропущен (не указан)
    echo.
)

REM Проверка remote
echo [INFO] Текущие remote-репозитории:
echo.
git remote -v
echo.

echo ========================================
echo   Настройка завершена!
echo ========================================
echo.
echo Следующие шаги:
echo.
echo 1. Проверьте файлы для коммита:
echo      git status
echo.
echo 2. Создайте первый коммит:
echo      git add .
echo      git commit -m "feat: initial commit"
echo.
echo 3. Отправьте на GitHub:
echo      git branch -M main
echo      git push -u origin main
echo.
if not "%GITVERSE_USER%"=="" (
echo 4. Отправьте на GitVerse:
echo      git push gitverse main
echo.
)
echo 5. Добавьте Secrets в GitHub:
echo      Settings -> Secrets and variables -> Actions
echo      См. GITHUB-SETUP.md для полного списка
echo.
pause
