/**
 * Типы окружения мобильного приложения.
 */
declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_URL?: string
    EXPO_PUBLIC_SOCKET_URL?: string
    EAS_PROJECT_ID?: string
  }
}