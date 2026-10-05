# Приложения KINOOX

KINOOX — это сайт **и** полноценные нативные приложения. PWA не используется:
service worker и манифест не подключаются нигде.

| Платформа | Технология | Формат поставки |
|---|---|---|
| Android | React Native + Expo | APK напрямую с kinoox.ru/download |
| iOS | React Native + Expo | TestFlight |
| Windows | Tauri 2 (Rust + WebView2) | .exe (NSIS) и .msi |
| macOS | Tauri 2 (Rust + WKWebView) | .dmg и .app |
| Linux | Tauri 2 (Rust + WebKitGTK) | .AppImage, .deb, .rpm |

## Мобильные приложения (Android и iOS)

### Стек

React Native 0.76 + Expo 52, Reanimated 3, React Navigation 7,
react-native-gesture-handler, expo-av, expo-notifications,
expo-secure-store, AsyncStorage.

### Экраны

| Экран | Файл | Возможности |
|---|---|---|
| Главная | `screens/screens.tsx` → `HomeScreen` | Подборки в горизонтальных лентах, pull-to-refresh с логотипом KINOOX |
| Поиск | `SearchScreen` | Живые подсказки, популярные запросы |
| Тайтл | `TitleScreen` | Описание, сезоны и серии, закладка с heart-burst, сохранение в офлайн |
| Плеер | `screens/PlayerScreen.tsx` | Полноэкранный, жесты, переключение источников |
| Закладки | `BookmarksScreen` | Синхронизация с сервером |
| История | `HistoryScreen` | Продолжение просмотра |
| Офлайн | `DownloadsScreen` | Сохранённые тайтлы и обновление кэша |
| Профиль | `ProfileScreen` | Вход, включение уведомлений, выход |

### Навигация

- `navigation/RootNavigator.tsx` — стек: таб-бар + модальные экраны тайтла и плеера.
- `navigation/MainTabs.tsx` — нижний таб-бар со стеклом (BlurView),
  активный индикатор — градиентная полоска flux → prism.

### Плеер и жесты

`screens/PlayerScreen.tsx`:

- **свайп влево/вправо** — перемотка на 10 секунд (при длинном свайпе до 30 секунд);
- **свайп вверх** — следующая серия;
- **свайп вниз** — выход из плеера;
- контролы скрываются через 3 секунды бездействия;
- прогресс-бар с градиентом flux → prism и пульсирующей точкой;
- переключение источников Vibix / Veoveo — анимированные капсулы снизу;
- полноэкранный режим с поворотом в ландшафт (`expo-screen-orientation`);
- Picture-in-Picture и AirPlay / Chromecast — средствами системы.

### Офлайн-режим

`services/DownloadService.ts`:

- сохраняет описания тайтлов и серии в AsyncStorage;
- скачивает постеры в `FileSystem.documentDirectory` и подставляет локальные пути;
- кэширует каталог целиком (первые 60 тайтлов) для работы без интернета;
- определяет состояние сети через `@react-native-community/netinfo`;
- при отсутствии сети экран тайтла открывает сохранённую копию.

### Уведомления

`services/NotificationService.ts`:

- запрашивает разрешение и получает push-токен (FCM для Android, APNs для iOS);
- создаёт канал «Новые серии» с акцентным цветом `#FF3D6E`;
- подписка и отписка от тайтлов через API;
- локальные уведомления, когда приложение открыто;
- счётчик непрочитанных на иконке приложения.

### Хранение токенов

`lib/storage.ts` — `SecureTokenStorage` на базе `expo-secure-store`
(EncryptedSharedPreferences на Android, Keychain на iOS). Токены
не попадают в AsyncStorage.

### Сборка

```bash
cd apps/mobile
pnpm install
pnpm start              # локальная разработка
pnpm build:android      # EAS Build → APK
pnpm build:ios          # EAS Build → IPA для TestFlight
pnpm build:preview      # внутренняя сборка для тестирования
```

Конфигурация EAS — `apps/mobile/eas.json`, профили: `development`,
`preview`, `production`, `production-store`.

Секреты для подписи (keystore Android, сертификат и профиль iOS)
хранятся в секретах GitHub и передаются в CI.

## Десктопные приложения (Tauri 2)

### Стек

Tauri 2 (Rust), Vite для фронтенда, плагины: shell, os, process,
notification, store, window-state, autostart, updater.

### Нативные возможности

Реализованы в Rust (`src-tauri/src/`):

| Возможность | Команда / реализация |
|---|---|
| Окно без рамок | `tauri.conf.json` → `decorations: false` |
| Кастомный заголовок | `window_control` (minimize, maximize, close, quit) |
| Системный трей | `tray.rs` — меню с «Продолжить просмотр», «Поиск», «Выход» |
| Мини-плеер | `toggle_mini_player` — окно 420×260 всегда поверх окон |
| Автозапуск с системой | `set_autostart` через `tauri-plugin-autostart` |
| Нативные уведомления | `notify_new_episode` |
| Продолжение просмотра | `set_continue_watching` / `get_continue_watching` |
| Настройки | `save_settings` / `load_settings` |
| Автообновление | `tauri-plugin-updater` с эндпоинтом kinoox.ru |

### Горячие клавиши

| Клавиша | Действие |
|---|---|
| `Ctrl+F` | Поиск по каталогу |
| `Ctrl+D` | Добавить в закладки |
| `Space` | Пауза / воспроизведение |
| `Esc` | Выход из плеера |
| `Ctrl+Q` | Завершение приложения |

### Размер приложения

Благодаря Tauri бинарник занимает 5–10 МБ вместо 80+ МБ у Electron:
используется системный WebView, а не встроенный Chromium.

### Сборка

```bash
cd apps/desktop
pnpm install
pnpm dev                # разработка
pnpm build:windows      # .exe (NSIS) и .msi
pnpm build:macos        # .dmg и .app
pnpm build:linux        # .AppImage, .deb, .rpm
```

Требования: Rust stable, для Linux — `libwebkit2gtk-4.1-dev`,
`libappindicator3-dev`, `librsvg2-dev`, `patchelf`.

### Права

`src-tauri/capabilities/`:

- `default.json` — базовые права окна, уведомления, хранилище, автообновление;
- `window.json` — управление кастомным заголовком;
- `fs.json` — чтение и запись только в каталоги приложения и загрузок.

## Страница загрузки

`https://kinoox.ru/download` содержит:

1. `DownloadHero` — полноэкранный баннер с анимированными частицами,
   логотипом KINOOX, слоганом и 5 пульсирующими иконками платформ;
2. `PlatformSelector` — 5 табов с morph-анимацией, описанием, кнопками
   скачивания, QR-кодом, версией, размером и системными требованиями;
3. `FeatureShowcase` — сетка 3×2 с возможностями приложений;
4. `ScreenshotsGallery` — горизонтальная галерея с zoom по клику и параллаксом;
5. `StatsBar` — числа с count-up анимацией;
6. `ChangelogSection` — история версий из `/api/v1/downloads/changelog`;
7. `FAQSection` — аккордеон с ответами, включая объяснение отличия от PWA;
8. Подвал — CTA на главную и ссылки на документы.

Данные берутся из API `/api/v1/downloads`. Если API недоступен, страница
рендерится из резервного реестра `apps/web/src/lib/platforms.ts`.

## CI/CD

| Workflow | Триггер | Результат |
|---|---|---|
| `build-mobile.yml` | тег `mobile-v*` | APK и IPA, публикация на сервер |
| `build-desktop.yml` | тег `desktop-v*` | .exe, .msi, .dmg, .AppImage, .deb, .rpm |
| `deploy-api.yml` | push в `main` (apps/api) | Пересборка и перезапуск API, smoke-тесты |
| `deploy-web.yml` | push в `main` (apps/web) | Пересборка сайта, проверка страниц и SSL |

Секреты репозитория: `SERVER_IP`, `SERVER_USER`, `SSH_PRIVATE_KEY`,
`EXPO_TOKEN`, `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`,
`ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, `IOS_DIST_CERT_BASE64`,
`IOS_PROVISIONING_PROFILE_BASE64`, `IOS_DIST_CERT_PASSWORD`, `APPLE_ID`,
`APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`, `TAURI_SIGNING_PRIVATE_KEY`,
`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, `WINDOWS_CERTIFICATE`,
`WINDOWS_CERTIFICATE_PASSWORD`.