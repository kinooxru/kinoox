# 🚀 Настройка репозитория KINOOX — GitHub + GitVerse

## ⚡ Быстрый старт (5 минут)

### 1. Создание репозитория на GitHub

1. Перейдите на https://github.com/new
2. Введите имя: `kinoox`
3. **Private** (рекомендуется) или **Public**
4. **НЕ** отмечайте "Initialize with README"
5. Нажмите **Create repository**

### 2. Создание репозитория на GitVerse

1. Перейдите на https://gitverse.ru/new (или ваша instance)
2. Введите имя: `kinoox`
3. **Private**
4. Нажмите **Create repository**

---

## 📝 Пошаговая настройка

### Шаг 1: Инициализация Git

Откройте PowerShell в `D:/KINOOX` и выполните:

```powershell
# Инициализация git-репозитория
git init

# Настройка имени и email
git config --global user.name "Ваше Имя"
git config --global user.email "your@email.com"
```

### Шаг 2: Добавление remote-репозиториев

Замените `<username>` на ваш GitHub/GitVerse username:

```powershell
# GitHub — основной remote (origin)
git remote add origin https://github.com/<username>/kinoox.git

# GitVerse — второй remote
git remote add gitverse https://gitverse.ru/<username>/kinoox.git
```

Проверьте:
```powershell
git remote -v
# origin    https://github.com/<username>/kinoox.git (fetch)
# origin    https://github.com/<username>/kinoox.git (push)
# gitverse  https://gitverse.ru/<username>/kinoox.git (fetch)
# gitverse  https://gitverse.ru/<username>/kinoox.git (push)
```

### Шаг 3: Первый коммит и push

```powershell
# Добавить все файлы
git add .

# Проверить что будет коммититься
git status

# Создать первый коммит
git commit -m "feat: initial commit — KINOOX online cinema platform

- Next.js 14 website (20 routes)
- Fastify REST API (10 modules)
- React Native mobile app (Expo 52)
- Tauri 2 desktop app (Windows/macOS/Linux)
- Docker infrastructure (20 services)
- GitHub Actions CI/CD (4 workflows)
- Design system 'Cinematic Flow'"

# Создать branch main
git branch -M main

# Push на оба репозитория
git push -u origin main
git push gitverse main
```

### Шаг 4: Создание тегов для сборок

Когда будете готовы к первой сборке:

```powershell
# Десктоп
git tag desktop-v1.0.0
git push gitverse desktop-v1.0.0   # GitVerse CI
git push origin desktop-v1.0.0     # GitHub CI

# Мобильное
git tag mobile-v1.0.0
git push gitverse mobile-v1.0.0
git push origin mobile-v1.0.0
```

---

## 🔐 Настройка Secrets в GitHub

Перейдите: **Settings → Secrets and variables → Actions → New repository secret**

### Базовые секреты (для всех workflow)

| Secret | Описание | Пример |
|---|---|---|
| `SERVER_IP` | IP продакшн-сервера | `95.216.97.185` |
| `SERVER_USER` | Пользователь SSH | `root` |
| `SSH_PRIVATE_KEY` | SSH-ключ для деплоя | См. инструкцию ниже |

### Генерация SSH-ключа для деплоя

```powershell
# Создать новый ключ (если нет)
ssh-keygen -t ed25519 -C "kinoox-deploy" -f D:/KINOOX/.tools/deploy-key -N ""

# Показать приватный ключ (скопировать целиком)
cat D:/KINOOX/.tools/deploy-key

# Добавить публичный ключ на сервер
ssh-copy-id -i D:/KINOOX/.tools/deploy-key.pub root@95.216.97.185
```

**Вставить значение `SSH_PRIVATE_KEY` в GitHub Secrets** (скопировать содержимое файла `deploy-key` без `.pub`).

### Мобильные секреты (для build-mobile.yml)

| Secret | Описание | Как получить |
|---|---|---|
| `EXPO_TOKEN` | Expo CLI token | `npx expo login` → https://expo.dev/settings/access-tokens |
| `ANDROID_KEYSTORE_BASE64` | Keystore в base64 | `certutil -encode apps/mobile/secrets/kinoox.keystore apps/mobile/secrets/keystore.b64` → скопировать содержимое |
| `ANDROID_KEYSTORE_PASSWORD` | Пароль от keystore | Ваш пароль |
| `ANDROID_KEY_ALIAS` | Alias ключа подписи | Ваш alias (обычно `release`) |
| `ANDROID_KEY_PASSWORD` | Пароль от ключа | Обычно тот же, что и keystore |
| `IOS_DIST_CERT_BASE64` | Distribution-сертификат в base64 | `certutil -encode your-cert.p12 cert.b64` |
| `IOS_PROVISIONING_PROFILE_BASE64` | Provisioning profile в base64 | Скопировать содержимое `.mobileprovision` как base64 |
| `IOS_DIST_CERT_PASSWORD` | Пароль от сертификата | Ваш пароль |
| `APPLE_ID` | Apple ID для Developer Account | your@appleid.com |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password | https://appleid.apple.com → Security → App-Specific Passwords |

### Десктопные секреты (для build-desktop.yml)

| Secret | Описание | Как получить |
|---|---|---|
| `TAURI_SIGNING_PRIVATE_KEY` | Ключ подписи обновлений Tauri | `tauri keys generate` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Пароль от ключа подписи | Ваш пароль |
| `WINDOWS_CERTIFICATE` | Сертификат подписи Windows (`.pfx`) | Купить/получить в Digicert, GlobalSign и т.д. |
| `WINDOWS_CERTIFICATE_PASSWORD` | Пароль от сертификата | Ваш пароль |
| `APPLE_CERTIFICATE` | macOS distribution-сертификат (`.p12`) | Apple Developer Portal → Certificates |
| `APPLE_CERTIFICATE_PASSWORD` | Пароль от сертификата | Ваш пароль |
| `APPLE_SIGNING_IDENTITY` | Signing identity | Из Keychain Access (например: `iPhone Developer: ...`) |
| `APPLE_TEAM_ID` | Apple Team ID | Apple Developer Portal → Membership |

---

## 🔐 Настройка Secrets в GitVerse

Аналогично GitHub: **Settings → Secrets → Actions**

Список secrets идентичный. Однако:
- GitVerse CI может отличаться от GitHub Actions
-可能需要 адаптировать workflow-файлы
- Проверьте документацию GitVerse CI

---

## 🔄 Синхронизация между GitHub и GitVerse

### Push на оба репозитория одновременно

```powershell
git push origin main --tags
git push gitverse main --tags
```

### Или создать alias

Добавьте в `~/.gitconfig`:

```ini
[alias]
    push-all = !git push origin main --tags && git push gitverse main --tags
    pull-all = !git fetch origin && git fetch gitverse && git merge origin/main
```

Теперь:
```powershell
git push-all
```

---

## 📋 Чек-лист перед первым push

- [ ] `.env` НЕ добавлен в git (есть в `.gitignore`)
- [ ] `.env.example` заполнен примерами
- [ ] `apps/mobile/secrets/` исключён из git
- [ ] `apps/desktop/secrets/` исключён из git
- [ ] `storage/` исключён из git
- [ ] `docker/data/` исключён из git
- [ ] `deploy/ssl/` исключён из git
- [ ] Все `*.keystore`, `*.p12`, `*.mobileprovision` исключены
- [ ] Проверить `git status` — нет ли лишних файлов
- [ ] Secrets добавлены в GitHub
- [ ] Secrets добавлены в GitVerse (если нужен)
- [ ] SSH-ключ добавлен на продакшн-сервер

---

## 🛠 Полезные команды

```powershell
# Проверить статус
git status

# Посмотреть diff
git diff HEAD

# Посмотреть последние коммиты
git log -n 5 --oneline

# Отправить изменения на оба репозитория
git push origin main
git push gitverse main

# Создать feature branch
git checkout -b feature/new-module
git push origin feature/new-module
git push gitverse feature/new-module

# Pull request (GitHub)
gh pr create --base main --title "feat: ..." --body "..."

# Sync с main
git checkout main
git pull origin main
git push gitverse main
```

---

## 🆘 Решение проблем

### "fatal: remote origin already exists"
```powershell
git remote remove origin
git remote add origin https://github.com/<username>/kinoox.git
```

### "Permission denied (publickey)"
- Проверьте SSH-ключ: `ssh -T git@github.com`
- Добавьте ключ в SSH-agent: `ssh-add D:/KINOOX/.tools/deploy-key`
- Убедитесь, что публичный ключ добавлен в GitHub Settings → SSH keys

### "Failed to push some refs"
```powershell
git pull origin main --rebase
git push origin main
```

### Конфликт с GitVerse
```powershell
# Получить изменения с GitVerse
git fetch gitverse
git merge gitverse/main
# Разрешить конфликты
git add .
git commit -m "resolve merge conflict"
git push origin main
git push gitverse main
```

---

## 📚 Документация

- GitHub Docs: https://docs.github.com/en/actions
- GitVerse Docs: https://docs.gitverse.ru (проверьте вашу instance)
- Tauri Docs: https://tauri.app/v1/guides/building/windows/
- Expo Docs: https://docs.expo.dev/build-reference/
- GitHub Secrets: https://docs.github.com/en/actions/security-guides/encrypted-secrets
