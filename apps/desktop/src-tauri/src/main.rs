// KINOOX Desktop — нативный клиент для Windows, macOS и Linux.
//
// Возможности, реализованные на стороне Rust:
//   • окно без рамок с кастомным заголовком;
//   • системный трей: «Продолжить просмотр», «Поиск», «Выход»;
//   • глобальные горячие клавиши: Ctrl+F, Ctrl+D, Space, Esc;
//   • мини-плеер (always on top) для режима Picture-in-Picture;
//   • нативные уведомления ОС о новых сериях.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, WebviewWindow, WindowEvent,
};

/// Продолжение просмотра: последний открытый тайтл.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContinueWatching {
    pub title_id: i64,
    pub title_name: String,
    pub season: Option<i64>,
    pub episode: Option<i64>,
}

/// Состояние мини-плеера.
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct MiniPlayerState {
    pub active: bool,
}

/// Показать окно и сфокусировать его.
fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

/// Переключить режим «мини-плеер»: маленькое окно всегда поверх остальных.
#[tauri::command]
fn toggle_mini_player(app: AppHandle, active: bool) -> Result<MiniPlayerState, String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "Окно main не найдено".to_string())?;

    if active {
        window
            .set_always_on_top(true)
            .map_err(|error| error.to_string())?;
        window
            .set_size(tauri::LogicalSize::new(420.0, 260.0))
            .map_err(|error| error.to_string())?;
        window
            .set_decorations(false)
            .map_err(|error| error.to_string())?;
        let _ = window.set_resizable(true);
    } else {
        window
            .set_always_on_top(false)
            .map_err(|error| error.to_string())?;
        window
            .set_size(tauri::LogicalSize::new(1280.0, 820.0))
            .map_err(|error| error.to_string())?;
        let _ = window.center();
    }

    let state = MiniPlayerState { active };
    let _ = window.emit("mini-player-changed", state);
    Ok(state)
}

/// Запомнить тайтл для пункта трея «Продолжить просмотр».
#[tauri::command]
fn set_continue_watching(app: AppHandle, item: ContinueWatching) -> Result<(), String> {
    let store_path = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?
        .join("continue_watching.json");

    if let Some(parent) = store_path.parent() {
        std::fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    let serialized = serde_json::to_string_pretty(&item).map_err(|error| error.to_string())?;
    std::fs::write(store_path, serialized).map_err(|error| error.to_string())?;
    Ok(())
}

/// Прочитать запись «Продолжить просмотр».
#[tauri::command]
fn get_continue_watching(app: AppHandle) -> Option<ContinueWatching> {
    let store_path = app.path().app_data_dir().ok()?.join("continue_watching.json");
    let raw = std::fs::read_to_string(store_path).ok()?;
    serde_json::from_str(&raw).ok()
}

/// Показать нативное уведомление ОС о новой серии.
#[tauri::command]
fn notify_new_episode(app: AppHandle, title: String, body: String) -> Result<(), String> {
    use tauri_plugin_notification_export::NotificationExt;
    app.notification()
        .builder()
        .title(title)
        .body(body)
        .show()
        .map_err(|error| error.to_string())
}

/// Запускать приложение вместе с системой.
#[tauri::command]
fn set_autostart(app: AppHandle, enabled: bool) -> Result<(), String> {
    use tauri_plugin_autostart_export::ManagerExt;
    let manager = app.autolaunch();
    if enabled {
        manager.enable().map_err(|error| error.to_string())
    } else {
        manager.disable().map_err(|error| error.to_string())
    }
}

/// Обработка кастомного заголовка окна: свернуть, развернуть, закрыть.
#[tauri::command]
fn window_control(window: WebviewWindow, action: String) -> Result<(), String> {
    match action.as_str() {
        "minimize" => window.minimize().map_err(|error| error.to_string()),
        "maximize" => {
            if window.is_maximized().unwrap_or(false) {
                window.unmaximize().map_err(|error| error.to_string())
            } else {
                window.maximize().map_err(|error| error.to_string())
            }
        }
        "close" => {
            // Закрываем в трей, а не завершаем приложение
            window.hide().map_err(|error| error.to_string())
        }
        "quit" => {
            window.app_handle().exit(0);
            Ok(())
        }
        other => Err(format!("Неизвестное действие окна: {other}")),
    }
}

fn build_tray(app: &AppHandle) -> tauri::Result<()> {
    let continue_item = MenuItem::with_id(app, "continue", "Продолжить просмотр", true, None::<&str>)?;
    let search_item = MenuItem::with_id(app, "search", "Поиск", true, Some("CmdOrCtrl+F"))?;
    let bookmark_item = MenuItem::with_id(app, "bookmark", "Добавить в закладки", true, None::<&str>)?;
    let mini_player_item = MenuItem::with_id(app, "mini_player", "Мини-плеер", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let show_item = MenuItem::with_id(app, "show", "Открыть KINOOX", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Выход", true, Some("CmdOrCtrl+Q"))?;

    let menu = Menu::with_items(
        app,
        &[
            &continue_item,
            &search_item,
            &bookmark_item,
            &mini_player_item,
            &separator,
            &show_item,
            &separator,
            &quit_item,
        ],
    )?;

    TrayIconBuilder::with_id("main-tray")
        .icon(app.default_window_icon().cloned().unwrap())
        .tooltip("KINOOX")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "continue" => {
                show_main_window(app);
                if let Some(state) = get_continue_watching(app.clone()) {
                    let _ = app.emit("tray:continue", state);
                }
            }
            "search" => {
                show_main_window(app);
                let _ = app.emit("tray:search", ());
            }
            "bookmark" => {
                let _ = app.emit("tray:bookmark", ());
            }
            "mini_player" => {
                show_main_window(app);
                let _ = app.emit("tray:mini-player", ());
            }
            "show" => show_main_window(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            build_tray(app.handle())?;
            Ok(())
        })
        .on_window_event(|window, event| {
            // Закрытие окна сворачивает приложение в трей, а не завершает его
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            toggle_mini_player,
            set_continue_watching,
            get_continue_watching,
            notify_new_episode,
            set_autostart,
            window_control
        ])
        .run(tauri::generate_context!())
        .expect("Не удалось запустить приложение KINOOX");
}
