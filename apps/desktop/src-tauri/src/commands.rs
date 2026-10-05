// Команды, вызываемые из интерфейса через invoke().

use crate::{AppSettings, ContinueWatching, MiniPlayerState};
use tauri::{AppHandle, Emitter, Manager, WebviewWindow};

/// Переключить режим «мини-плеер»: маленькое окно поверх всех остальных.
#[tauri::command]
pub fn toggle_mini_player(app: AppHandle, active: bool) -> Result<MiniPlayerState, String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "Окно main не найдено".to_string())?;

    if active {
        window.set_always_on_top(true).map_err(|e| e.to_string())?;
        window
            .set_size(tauri::LogicalSize::new(420.0, 260.0))
            .map_err(|e| e.to_string())?;
    } else {
        window.set_always_on_top(false).map_err(|e| e.to_string())?;
        window
            .set_size(tauri::LogicalSize::new(1280.0, 820.0))
            .map_err(|e| e.to_string())?;
        let _ = window.center();
    }

    let state = MiniPlayerState { active };
    let _ = window.emit("mini-player-changed", state);
    Ok(state)
}

/// Запомнить тайтл для пункта трея «Продолжить просмотр».
#[tauri::command]
pub fn set_continue_watching(app: AppHandle, item: ContinueWatching) -> Result<(), String> {
    let path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("continue_watching.json");

    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let serialized = serde_json::to_string_pretty(&item).map_err(|e| e.to_string())?;
    std::fs::write(path, serialized).map_err(|e| e.to_string())
}

/// Прочитать запись «Продолжить просмотр».
#[tauri::command]
pub fn get_continue_watching(app: AppHandle) -> Option<ContinueWatching> {
    let path = app.path().app_data_dir().ok()?.join("continue_watching.json");
    let raw = std::fs::read_to_string(path).ok()?;
    serde_json::from_str(&raw).ok()
}

/// Сохранить настройки приложения.
#[tauri::command]
pub fn save_settings(app: AppHandle, settings: AppSettings) -> Result<(), String> {
    let path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("settings.json");

    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let serialized = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    std::fs::write(path, serialized).map_err(|e| e.to_string())
}

/// Прочитать настройки приложения.
#[tauri::command]
pub fn load_settings(app: AppHandle) -> AppSettings {
    let result = app
        .path()
        .app_data_dir()
        .ok()
        .map(|dir| dir.join("settings.json"))
        .and_then(|path| std::fs::read_to_string(path).ok())
        .and_then(|raw| serde_json::from_str::<AppSettings>(&raw).ok());

    result.unwrap_or_default()
}

/// Показать нативное уведомление ОС о новой серии.
#[tauri::command]
pub fn notify_new_episode(app: AppHandle, title: String, body: String) -> Result<(), String> {
    use tauri_plugin_notification::NotificationExt;
    app.notification()
        .builder()
        .title(title)
        .body(body)
        .show()
        .map_err(|e| e.to_string())
}

/// Включить или выключить автозапуск с системой.
#[tauri::command]
pub fn set_autostart(app: AppHandle, enabled: bool) -> Result<(), String> {
    use tauri_plugin_autostart::ManagerExt;
    let manager = app.autolaunch();
    if enabled {
        manager.enable().map_err(|e| e.to_string())
    } else {
        manager.disable().map_err(|e| e.to_string())
    }
}

/// Управление окном из кастомного заголовка (frameless-режим).
#[tauri::command]
pub fn window_control(window: WebviewWindow, action: String) -> Result<(), String> {
    match action.as_str() {
        "minimize" => window.minimize().map_err(|e| e.to_string()),
        "maximize" => {
            if window.is_maximized().unwrap_or(false) {
                window.unmaximize().map_err(|e| e.to_string())
            } else {
                window.maximize().map_err(|e| e.to_string())
            }
        }
        // Закрываем в трей, а не завершаем приложение
        "close" => window.hide().map_err(|e| e.to_string()),
        "quit" => {
            window.app_handle().exit(0);
            Ok(())
        }
        other => Err(format!("Неизвестное действие окна: {other}")),
    }
}

/// Открыть ссылку во внешнем браузере — например, страницу загрузки мобильного приложения.
#[tauri::command]
pub fn open_external(url: String) -> Result<(), String> {
    if !url.starts_with("https://") {
        return Err("Разрешены только HTTPS-ссылки".to_string());
    }
    tauri_plugin_shell::ShellExt::shell(&tauri::AppHandle::default())
        .open(&url, None)
        .map_err(|e| e.to_string())
}
