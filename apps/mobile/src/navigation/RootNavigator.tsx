/**
 * RootNavigator — корневая навигация мобильного приложения.
 *
 * Стек: главный таб-бар (стеклянный) + модальные экраны тайтла и плеера.
 */
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { NavigationContainer, DarkTheme, type Theme } from '@react-navigation/native'
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack'
import type { EpisodeDTO, PlayerSource, TitleDTO } from '@kinoox/api-client'
import { MainTabs } from './MainTabs'
import { PlayerScreen } from '../screens/PlayerScreen'
import { colors } from '../lib/config'

export type RootStackParamList = {
  Tabs: undefined
  Player: {
    title: TitleDTO
    sources: PlayerSource[]
    episodes: EpisodeDTO[]
  }
}

const Stack = createNativeStackNavigator<RootStackParamList>()

/**
 * Обёртка плеера: достаёт параметры маршрута и передаёт их в PlayerScreen.
 * Нужна потому, что компонент экрана не получает пропсы напрямую от навигатора.
 */
function PlayerRoute({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Player'>) {
  const { title, sources, episodes } = route.params

  return (
    <PlayerScreen
      title={title}
      sources={sources}
      episodes={episodes}
      onClose={() => navigation.goBack()}
    />
  )
}

/** Тема навигации в стиле дизайн-системы «Cinematic Flow» */
const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.fluxFrom,
    background: colors.void,
    card: colors.abyss,
    text: colors.textPrimary,
    border: colors.frost,
    notification: colors.fluxFrom,
  },
}

export function RootNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.void },
          animation: 'fade_from_bottom',
          animationDuration: 400,
        }}
      >
        <Stack.Screen name="Tabs" component={MainTabs} />
        <Stack.Screen
          name="Player"
          component={PlayerRoute}
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
            orientation: 'all',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

/** Экран-заглушка для отладки навигации */
export function PlaceholderScreen({ label }: { label: string }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.text}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.void,
  },
  text: { color: colors.textSecondary, fontSize: 14 },
})
