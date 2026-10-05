# ─────────────────────────────────────────────────────────────
#  KINOOX — Полный список Secrets для GitHub Actions
#  Добавляйте через: Settings → Secrets and variables → Actions
# ─────────────────────────────────────────────────────────────

# ═══════════════════════════════════════════════════════════════
#  БАЗОВЫЕ СЕКРЕТЫ (для всех 4 workflow)
# ═══════════════════════════════════════════════════════════════

# SERVER_IP — IP продакшн-сервера
# Используется в: deploy-api, deploy-web, build-mobile, build-desktop
# Значение: 95.216.97.185
SERVER_IP=95.216.97.185

# SERVER_USER — SSH-пользователь на сервере
# Используется в: deploy-api, deploy-web, build-mobile, build-desktop
# Значение: root
SERVER_USER=root

# SSH_PRIVATE_KEY — приватный SSH-ключ для деплоя на сервер
# Используется в: deploy-api, deploy-web, build-mobile, build-desktop
# Генерация: ssh-keygen -t ed25519 -C "kinoox-deploy" -f deploy-key -N ""
# Содержимое файла deploy-key (без .pub)
SSH_PRIVATE_KEY=<содержимое файла deploy-key>


# ═══════════════════════════════════════════════════════════════
#  МОБИЛЬНЫЕ СЕКРЕТЫ (для build-mobile.yml)
# ═══════════════════════════════════════════════════════════════

# EXPO_TOKEN — токен для Expo CLI
# Используется в: build-mobile (ios job)
# Получение: npx expo login → https://expo.dev/settings/access-tokens → Create new token
EXPO_TOKEN=<expo-token>

# ── Android ────────────────────────────────────────────────────

# ANDROID_KEYSTORE_BASE64 — keystore в base64
# Используется в: build-mobile (android job)
# Генерация (PowerShell):
#   [Convert]::ToBase64String([IO.File]::ReadAllBytes("apps/mobile/secrets/kinoox.keystore"))
# Значение: строка base64
ANDROID_KEYSTORE_BASE64=<base64-keystore>

# ANDROID_KEYSTORE_PASSWORD — пароль от keystore
# Используется в: build-mobile (android job)
ANDROID_KEYSTORE_PASSWORD=<password>

# ANDROID_KEY_ALIAS — alias ключа подписи
# Используется в: build-mobile (android job)
# Узнать: keytool -list -v -keystore apps/mobile/secrets/kinoox.keystore
ANDROID_KEY_ALIAS=<alias>

# ANDROID_KEY_PASSWORD — пароль от ключа подписи
# Используется в: build-mobile (android job)
# Обычно совпадает с ANDROID_KEYSTORE_PASSWORD
ANDROID_KEY_PASSWORD=<password>

# ── iOS ────────────────────────────────────────────────────────

# IOS_DIST_CERT_BASE64 — distribution-сертификат (.p12) в base64
# Используется в: build-mobile (ios job)
# Генерация:
#   [Convert]::ToBase64String([IO.File]::ReadAllBytes("apps/mobile/secrets/dist.p12"))
IOS_DIST_CERT_BASE64=<base64-cert>

# IOS_PROVISIONING_PROFILE_BASE64 — provisioning profile в base64
# Используется в: build-mobile (ios job)
# Скопировать содержимое .mobileprovision как base64
IOS_PROVISIONING_PROFILE_BASE64=<base64-profile>

# IOS_DIST_CERT_PASSWORD — пароль от distribution-сертификата
# Используется в: build-mobile (ios job)
IOS_DIST_CERT_PASSWORD=<password>

# APPLE_ID — Apple ID для Developer Account
# Используется в: build-mobile (ios job), build-desktop (macOS)
APPLE_ID=<your@appleid.com>

# APPLE_APP_SPECIFIC_PASSWORD — app-specific password
# Используется в: build-mobile (ios job), build-desktop (macOS)
# Получение: https://appleid.apple.com → Security → App-Specific Passwords → Generate
APPLE_APP_SPECIFIC_PASSWORD=<xxxx-xxxx-xxxx-xxxx>

# ═══════════════════════════════════════════════════════════════
#  ДЕСКТОПНЫЕ СЕКРЕТЫ (для build-desktop.yml)
# ═══════════════════════════════════════════════════════════════

# TAURI_SIGNING_PRIVATE_KEY — приватный ключ для подписи обновлений Tauri
# Используется в: build-desktop (build job)
# Генерация: npx tauri keys generate (в apps/desktop)
TAURI_SIGNING_PRIVATE_KEY=<tauri-private-key>

# TAURI_SIGNING_PRIVATE_KEY_PASSWORD — пароль от ключа подписи Tauri
# Используется в: build-desktop (build job)
TAURI_SIGNING_PRIVATE_KEY_PASSWORD=<password>

# ── Windows (опционально) ──────────────────────────────────────

# WINDOWS_CERTIFICATE — сертификат подписи Windows (.pfx) в base64
# Используется в: build-desktop (build job, Windows)
# Получение: купить в Digicert, GlobalSign, Sectigo и т.д.
# Генерация base64:
#   [Convert]::ToBase64String([IO.File]::ReadAllBytes("certificate.pfx"))
WINDOWS_CERTIFICATE=<base64-pfx>

# WINDOWS_CERTIFICATE_PASSWORD — пароль от Windows-сертификата
# Используется в: build-desktop (build job, Windows)
WINDOWS_CERTIFICATE_PASSWORD=<password>

# ── macOS ──────────────────────────────────────────────────────

# APPLE_CERTIFICATE — macOS distribution-сертификат (.p12) в base64
# Используется в: build-desktop (build job, macOS)
# Получение: Apple Developer Portal → Certificates → Download → export as .p12
# Генерация base64:
#   [Convert]::ToBase64String([IO.File]::ReadAllBytes("distribution.p12"))
APPLE_CERTIFICATE=<base64-p12>

# APPLE_CERTIFICATE_PASSWORD — пароль от macOS-сертификата
# Используется в: build-desktop (build job, macOS)
APPLE_CERTIFICATE_PASSWORD=<password>

# APPLE_SIGNING_IDENTITY — signing identity для macOS
# Используется в: build-desktop (build job, macOS)
# Узнать: security find-identity -v -p codesigning
# Пример: "iPhone Developer: John Doe (ABC123DEF4)"
APPLE_SIGNING_IDENTITY=<signing-identity>

# APPLE_TEAM_ID — Team ID от Apple Developer
# Используется в: build-desktop (build job, macOS)
# Узнать: https://developer.apple.com/account → Membership
APPLE_TEAM_ID=<ABC123DEF4>


# ═══════════════════════════════════════════════════════════════
#  СПИСОК ВСЕХ 21 СЕКРЕТА
# ═══════════════════════════════════════════════════════════════
#
#  Базовые (3):
#  ✓ SERVER_IP
#  ✓ SERVER_USER
#  ✓ SSH_PRIVATE_KEY
#
#  Мобильные (8):
#  ✓ EXPO_TOKEN
#  ✓ ANDROID_KEYSTORE_BASE64
#  ✓ ANDROID_KEYSTORE_PASSWORD
#  ✓ ANDROID_KEY_ALIAS
#  ✓ ANDROID_KEY_PASSWORD
#  ✓ IOS_DIST_CERT_BASE64
#  ✓ IOS_PROVISIONING_PROFILE_BASE64
#  ✓ IOS_DIST_CERT_PASSWORD
#  ✓ APPLE_ID (также для desktop)
#  ✓ APPLE_APP_SPECIFIC_PASSWORD (также для desktop)
#
#  Десктопные (10):
#  ✓ TAURI_SIGNING_PRIVATE_KEY
#  ✓ TAURI_SIGNING_PRIVATE_KEY_PASSWORD
#  ✓ WINDOWS_CERTIFICATE (опционально)
#  ✓ WINDOWS_CERTIFICATE_PASSWORD (опционально)
#  ✓ APPLE_CERTIFICATE
#  ✓ APPLE_CERTIFICATE_PASSWORD
#  ✓ APPLE_SIGNING_IDENTITY
#  ✓ APPLE_TEAM_ID
#
#  ИТОГО: 21 secret (19 обязательных + 2 опциональных для Windows)
#
# ═══════════════════════════════════════════════════════════════
#  КАК ДОБАВИТЬ В GITHUB
# ═══════════════════════════════════════════════════════════════
#
#  1. Откройте: https://github.com/<username>/kinoox/settings/secrets/actions
#  2. Нажмите "New repository secret"
#  3. Введите Name (например: SERVER_IP)
#  4. Введите Value (например: 95.216.97.185)
#  5. Нажмите "Add secret"
#  6. Повторите для всех 21 секретов
#
#  Альтернатива — через GitHub CLI:
#    gh secret set SERVER_IP --body "95.216.97.185"
#    gh secret set SERVER_USER --body "root"
#    gh secret set SSH_PRIVATE_KEY --body "$(cat .tools/deploy-key)"
#    ...
#
# ═══════════════════════════════════════════════════════════════
#  КАК ДОБАВИТЬ В GITVERSE
# ═══════════════════════════════════════════════════════════════
#
#  Аналогично GitHub:
#  1. Settings → Secrets → Actions
#  2. Добавьте те же 21 secret
#  3. Проверьте совместимость CI/CD GitVerse с GitHub Actions
#
# ═══════════════════════════════════════════════════════════════
