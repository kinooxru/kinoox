/**
 * NotificationService — push-уведомления о выходе новых серий.
 *
 * Android: Firebase Cloud Messaging через expo-notifications.
 * iOS: APNs через тот же модуль.
 * Уведомления приходят и при закрытом приложении.
 */
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { api } from '../lib/api'

/** Как показывать уведомление, когда приложение открыто */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export class NotificationService {
  private token: string | null = null

  /** Запросить разрешение и получить push-токен */
  async register(): Promise<string | null> {
    if (!Device.isDevice) return null

    const settings = await Notifications.getPermissionsAsync()
    let granted = settings.granted

    if (!granted) {
      const asked = await Notifications.requestPermissionsAsync()
      granted = asked.granted
    }

    if (!granted) return null

    // Канал для Android: акцентный цвет бейджа — flux
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('new-episodes', {
        name: 'Новые серии',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF3D6E',
      })
    }

    try {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
      const result = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      )
      this.token = result.data
      return this.token
    } catch {
      return null
    }
  }

  /** Подписаться на новые серии конкретного тайтла */
  async subscribeToTitle(titleId: number): Promise<boolean> {
    try {
      await api.system.subscribe(titleId)
      return true
    } catch {
      return false
    }
  }

  /** Отписаться от уведомлений по тайтлу */
  async unsubscribeFromTitle(titleId: number): Promise<boolean> {
    try {
      await api.system.unsubscribe(titleId)
      return true
    } catch {
      return false
    }
  }

  /**
   * Локальное уведомление о новой серии — показывается сразу,
   * если приложение уже открыто.
   */
  async showNewEpisode(params: {
    titleId: number
    titleName: string
    season: number
    episode: number
  }): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: params.titleName,
        body: `Вышла ${params.season} сезон ${params.episode} серия`,
        data: { titleId: params.titleId, season: params.season, episode: params.episode },
        sound: false,
      },
      trigger: null,
    })
  }

  /** Счётчик на иконке приложения */
  async setBadge(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count)
  }

  /** Подписка на нажатие уведомления */
  addResponseListener(handler: (titleId: number) => void): { remove(): void } {
    return Notifications.addNotificationResponseReceivedListener((response) => {
      const titleId = response.notification.request.content.data?.titleId
      if (typeof titleId === 'number') handler(titleId)
    })
  }
}

export const notificationService = new NotificationService()
