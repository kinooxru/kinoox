/**
 * MainTabs — нижний таб-бар со стеклом (glassmorphism).
 * Активный индикатор — градиентная полоска flux → prism.
 */
import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { EpisodeDTO, PlayerSource, TitleDTO } from '@kinoox/api-client'
import {
  BookmarksScreen,
  DownloadsScreen,
  HistoryScreen,
  HomeScreen,
  ProfileScreen,
  SearchScreen,
} from '../screens/screens'
import type { RootStackParamList } from './RootNavigator'
import { colors, layout } from '../lib/config'

type TabParamList = {
  Home: undefined
  Search: undefined
  Bookmarks: undefined
  Downloads: undefined
  Profile: undefined
}

const Tab = createBottomTabNavigator<TabParamList>()

type RootNavigation = NativeStackNavigationProp<RootStackParamList>

/** Внутренний стек экранов с общим обработчиком открытия тайтла */
function HomeStackScreen() {
  const navigation = useNavigation<RootNavigation>()
  return <HomeScreen onOpenTitle={(id) => navigation.navigate('Tabs')} />
}

function SearchTabScreen() {
  const navigation = useNavigation<RootNavigation>()
  return <SearchScreen onOpenTitle={() => navigation.navigate('Tabs')} />
}

function BookmarksTabScreen() {
  const navigation = useNavigation<RootNavigation>()
  return <BookmarksScreen onOpenTitle={() => navigation.navigate('Tabs')} />
}

function DownloadsTabScreen() {
  const navigation = useNavigation<RootNavigation>()
  return <DownloadsScreen onOpenTitle={() => navigation.navigate('Tabs')} />
}

const TABS: Array<{
  name: keyof TabParamList
  label: string
  icon: string
  component: React.ComponentType<object>
}> = [
  { name: 'Home', label: 'Главная', icon: '⌂', component: HomeStackScreen },
  { name: 'Search', label: 'Поиск', icon: '⌕', component: SearchTabScreen },
  { name: 'Bookmarks', label: 'Закладки', icon: '♥', component: BookmarksTabScreen },
  { name: 'Downloads', label: 'Офлайн', icon: '↓', component: DownloadsTabScreen },
  { name: 'Profile', label: 'Профиль', icon: '☺', component: ProfileScreen },
]

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        ),
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
      }}
    >
      {TABS.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarLabel: tab.label,
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={tab.icon} focused={focused} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  )
}

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View style={styles.tabIconWrap}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
      {focused ? (
        <LinearGradient
          colors={[colors.fluxFrom, colors.prismFrom]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.tabIndicator}
        />
      ) : null}
    </View>
  )
}

/** Кнопка, открывающая плеер из любого экрана */
export function PlayButton({
  title,
  sources,
  episodes,
}: {
  title: TitleDTO
  sources: PlayerSource[]
  episodes: EpisodeDTO[]
}) {
  const navigation = useNavigation<RootNavigation>()

  return (
    <Pressable
      onPress={() => navigation.navigate('Player', { title, sources, episodes })}
      accessibilityRole="button"
    >
      <LinearGradient
        colors={[colors.fluxFrom, colors.fluxTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.playButton}
      >
        <Text style={styles.playButtonText}>Смотреть</Text>
      </LinearGradient>
    </Pressable>
  )
}

/** Экран истории из таб-бара: переиспользует HistoryScreen */
export function HistoryTabScreen() {
  const navigation = useNavigation<RootNavigation>()
  return <HistoryScreen onOpenTitle={() => navigation.navigate('Tabs')} />
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 1,
    borderTopColor: colors.frost,
    backgroundColor: 'transparent',
    height: 64,
    paddingBottom: 6,
    paddingTop: 6,
    elevation: 0,
  },
  tabIconWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 4 },
  tabIcon: { color: colors.textMuted, fontSize: 18 },
  tabIconActive: { color: colors.textPrimary },
  tabIndicator: {
    marginTop: 4,
    width: 22,
    height: 2,
    borderRadius: 1,
  },
  playButton: {
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    marginTop: 12,
  },
  playButtonText: { color: colors.void, fontSize: 15, fontWeight: '700' },
})

export { layout }
