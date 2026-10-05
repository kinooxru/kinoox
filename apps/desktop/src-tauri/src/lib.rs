// Библиотечная часть приложения KINOOX Desktop.
// Используется для мобильных платформ Tauri и для тестов.

pub mod commands;
pub mod tray;

use serde::{Deserialize, Serialize};

/// Настройки окна и поведения приложения.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    /// Автозапуск с системой
    pub autostart: bool,
    /// Запускать свёрнутым в трей
    pub start_minimized: bool,
    /// Включать мини-плеер при сворачивании во время просмотра
    pub mini_player_on_minimize: bool,
    /// Показывать нативные уведомления о новых сериях
    pub notifications: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            autostart: false,
            start_minimized: false,
            mini_player_on_minimize: true,
            notifications: true,
        }
    }
}

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
