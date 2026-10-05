/// <reference types="vite/client" />

/**
 * Типы окружения десктопного приложения.
 *
 * Ссылка на vite/client даёт типы для import.meta.env; она живёт здесь,
 * а не в compilerOptions.types, потому что строка «vite/client» в types
 * ломает резолв в окружении редактора.
 */
interface ImportMetaEnv {
  /** Базовый URL API, например https://kinoox.ru/api/v1 */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}