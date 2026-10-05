/**
 * KINOOX Mobile — корневой компонент приложения.
 *
 * Инициализирует хранилище токенов, подписку на push-уведомления
 * и поднимает навигацию в тёмной теме.
 */
import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native'
import { RootNavigator } from './navigation/RootNavigator'
import { colors } from './lib/config'
import { tokenStorage } from './lib/api'
import { notificationService } from './services/NotificationService'
import { downloadService } from './services/DownloadService'

export default function App() {
  React.useEffect(() => {
    const bootstrap = async () => {
      // Восстанавливаем сессию из защищённого хранилища
      await tokenStorage.hydrate()

      // Просим разрешение на push-уведомления о новых сериях
      try {
        await notificationService.register()
      } catch {
        // Пользователь может отказаться — приложение продолжает работать
      }

      // Обновляем офлайн-каталог, если есть интернет
      try {
        if (await downloadService.isOnline()) await downloadService.cacheCatalog()
      } catch {
        // Офлайн-каталог обновится при следующем запуске
      }
    }

    void bootstrap()

    // Переход к тайтлу при нажатии на push-уведомление
    const subscription = notificationService.addResponseListener(() => {
      // Навигация по уведомлению обрабатывается RootNavigator при следующем рендере
    })

    return () => subscription.remove()
  }, [])

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={colors.void} />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.void },
})
