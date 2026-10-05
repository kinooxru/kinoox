# Инструкция по сборке готовых установщиков приложений KINOOX

В проекте полностью написан исходный код для всех приложений:
- **Мобильные (Android / iOS)**: каталог `apps/mobile` (React Native, Expo SDK 52)
- **Десктопные (Windows, macOS, Linux)**: каталог `apps/desktop` (Tauri 2, Rust, Vite)

После сборки файлы помещаются в каталог `storage/downloads/`, откуда автоматически раздаются сайтом и учитываются в счётчике загрузок:
- `storage/downloads/android/kinoox-1.0.0.apk`
- `storage/downloads/windows/kinoox-1.0.0.exe`
- `storage/downloads/windows/kinoox-1.0.0.msi`
- `storage/downloads/macos/kinoox-1.0.0.dmg`
- `storage/downloads/linux/kinoox-1.0.0.AppImage`
- `storage/downloads/linux/kinoox-1.0.0.deb`

---

## 1. Сборка Android APK (`kinoox-1.0.0.apk`)

### Вариант A. Через облачный сервис EAS Build (рекомендуемый, не требует Android Studio)
1. Установите EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Авторизуйтесь в аккаунте Expo:
   ```bash
   eas login
   ```
3. Запустите сборку APK:
   ```bash
   cd apps/mobile
   eas build -p android --profile production
   ```
4. Скачайте готовый APK по ссылке из консоли и положите в `storage/downloads/android/kinoox-1.0.0.apk`.

### Вариант B. Локальная сборка (требуется Android SDK и Java 17)
```bash
cd apps/mobile
npx expo run:android --variant release
```
Или:
```bash
cd apps/mobile
npx expo prebuild
cd android
./gradlew assembleRelease
```
Собранный файл будет в: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`.

---

## 2. Сборка Windows (.exe / .msi)

### Требования:
- Установленный **Rust**: [rustup.rs](https://rustup.rs/)
- **Visual Studio Build Tools** (C++ x64/x86 build tools)
- **Node.js**

### Команды:
```bash
cd apps/desktop
npm run tauri build
```
Готовые установщики будут созданы в папке:
`apps/desktop/src-tauri/target/release/bundle/nsis/kinoox_1.0.0_x64-setup.exe`  
Скопируйте его в: `storage/downloads/windows/kinoox-1.0.0.exe`.

---

## 3. Автоматическая сборка через GitHub Actions (без установки инструментов на компьютер)

В проекте уже настроены GitHub Workflows (`.github/workflows/build-mobile.yml` и `build-desktop.yml`):
1. Отправьте тег версии в ваш GitHub репозиторий:
   - Для сборки Android APK:
     ```bash
     git tag mobile-v1.0.0
     git push origin mobile-v1.0.0
     ```
   - Для сборки Windows/macOS/Linux:
     ```bash
     git tag desktop-v1.0.0
     git push origin desktop-v1.0.0
     ```
2. GitHub Actions соберёт установщики на своих серверах и выложит готовые файлы в раздел **Releases / Artifacts**.
