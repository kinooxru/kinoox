// Системный трей KINOOX: быстрый доступ к продолжению просмотра,
// поиску, мини-плееру и выходу.

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};

/// Показать и сфокусировать главное окно.
pub fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

/// Собрать меню трея и навесить обработчики.
pub fn build_tray(app: &AppHandle) -> tauri::Result<()> {
    let continue_item =
        MenuItem::with_id(app, "continue", "Продолжить просмотр", true, None::<&str>)?;
    let search_item = MenuItem::with_id(app, "search", "Поиск", true, Some("CmdOrCtrl+F"))?;
    let bookmark_item =
        MenuItem::with_id(app, "bookmark", "Добавить в закладки", true, Some("CmdOrCtrl+D"))?;
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
                if let Some(item) = crate::commands::get_continue_watching(app.clone()) {
                    let _ = app.emit("tray:continue", item);
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
            // Левый клик по иконке разворачивает окно
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
