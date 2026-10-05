/**
 * Экраны мобильного приложения KINOOX.
 */
import React from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated'
import type {
  BookmarkDTO,
  EpisodeDTO,
  PlayerSource,
  TitleCardDTO,
  TitleDTO,
  ViewHistoryDTO,
} from '@kinoox/api-client'
import { colors, layout } from '../lib/config'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { useBookmark } from '../hooks/useBookmark'
import { downloadService } from '../services/DownloadService'
import { notificationService } from '../services/NotificationService'

// ─────────────────────────────────────────────────────────────
//  Общие элементы
// ─────────────────────────────────────────────────────────────

/** Карточка тайтла: скругление 20px, бейдж рейтинга, нажатие с scale-анимацией */
export function TitleCard({
  title,
  onPress,
  width = 140,
}: {
  title: TitleCardDTO
  onPress(): void
  width?: number
}) {
  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const highRating = typeof title.ratingKp === 'number' && title.ratingKp > 7

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 18 })
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 18 })
        }}
        accessibilityRole="button"
        accessibilityLabel={`${title.title}, ${title.year}`}
      >
        <View style={[styles.cardPosterWrap, { width }]}>
          {title.posterUrl ? (
            <Image
              source={{ uri: title.posterUrl }}
              style={styles.cardPoster}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.cardPoster, styles.cardPosterFallback]} />
          )}

          <View style={styles.cardVeil} />

          <View
            style={[
              styles.ratingBadge,
              highRating ? styles.ratingBadgeHigh : styles.ratingBadgeLow,
            ]}
          >
            <Text style={[styles.ratingText, highRating && styles.ratingTextHigh]}>
              {typeof title.ratingKp === 'number' && title.ratingKp > 0
                ? title.ratingKp.toFixed(1)
                : '—'}
            </Text>
          </View>
        </View>

        <Text style={[styles.cardTitle, { width }]} numberOfLines={2}>
          {title.title}
        </Text>
        <Text style={styles.cardMeta}>
          {title.year}
          {title.genres.length > 0 ? ` · ${title.genres[0]}` : ''}
        </Text>
      </Pressable>
    </Animated.View>
  )
}

/** Кнопка с градиентом flux */
export function GradientButton({
  label,
  onPress,
  loading = false,
  variant = 'flux',
}: {
  label: string
  onPress(): void
  loading?: boolean
  variant?: 'flux' | 'prism'
}) {
  return (
    <Pressable onPress={onPress} disabled={loading} accessibilityRole="button">
      <LinearGradient
        colors={
          variant === 'flux' ? [colors.fluxFrom, colors.fluxTo] : [colors.prismFrom, colors.prismTo]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientButton}
      >
        {loading ? (
          <ActivityIndicator color={colors.void} />
        ) : (
          <Text style={[styles.gradientButtonText, variant === 'prism' && styles.prismButtonText]}>
            {label}
          </Text>
        )}
      </LinearGradient>
    </Pressable>
  )
}

/** Пульсирующий логотип для экранов загрузки */
export function LoadingState({ label = 'Загрузка' }: { label?: string }) {
  const opacity = useSharedValue(0.6)
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))

  React.useEffect(() => {
    opacity.value = withSequence(
      withSpring(1, { damping: 12 }),
      withSpring(0.6, { damping: 12 }),
    )
  }, [opacity])

  return (
    <View style={styles.centered}>
      <Animated.View style={style}>
        <LinearGradient
          colors={[colors.fluxFrom, colors.fluxTo]}
          style={styles.loadingLogo}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
      <Text style={styles.loadingLabel}>{label}</Text>
    </View>
  )
}

/** Скелетон карточки с shimmer-эффектом */
export function CardSkeleton({ width = 140 }: { width?: number }) {
  return (
    <View style={{ width }}>
      <View style={[styles.skeleton, { height: width * 1.5, borderRadius: layout.radiusCard }]} />
      <View style={[styles.skeleton, styles.skeletonLine, { width: width * 0.8 }]} />
      <View style={[styles.skeleton, styles.skeletonLine, { width: width * 0.45 }]} />
    </View>
  )
}

// ─────────────────────────────────────────────────────────────
//  HomeScreen
// ─────────────────────────────────────────────────────────────

export function HomeScreen({ onOpenTitle }: { onOpenTitle(id: number): void }) {
  const [trending, setTrending] = React.useState<TitleCardDTO[]>([])
  const [newReleases, setNewReleases] = React.useState<TitleCardDTO[]>([])
  const [topRated, setTopRated] = React.useState<TitleCardDTO[]>([])
  const [anime, setAnime] = React.useState<TitleCardDTO[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)

  const load = React.useCallback(async () => {
    try {
      const collections = await api.search.collections()
      setTrending(collections.trending.items)
      setNewReleases(collections.newReleases.items)
      setTopRated(collections.topRated.items)
      setAnime(collections.anime.items)
    } catch {
      // Офлайн: показываем сохранённый каталог
      setTrending(await downloadService.getOfflineTitles())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  if (loading) return <LoadingState label="Загружаем каталог" />

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true)
            void load()
          }}
          tintColor={colors.fluxFrom}
          colors={[colors.fluxFrom]}
        />
      }
    >
      <LinearGradient
        colors={[colors.void, colors.abyss]}
        style={styles.homeHero}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <Text style={styles.heroWordmark}>KINOOX</Text>
        <Text style={styles.heroSlogan}>Смотри. Чувствуй. Погружайся.</Text>
      </LinearGradient>

      <Rail title="В тренде" items={trending} onOpenTitle={onOpenTitle} />
      <Rail title="Новинки" items={newReleases} onOpenTitle={onOpenTitle} />
      <Rail title="Высокий рейтинг" items={topRated} onOpenTitle={onOpenTitle} />
      <Rail title="Аниме" items={anime} onOpenTitle={onOpenTitle} />
    </ScrollView>
  )
}

function Rail({
  title,
  items,
  onOpenTitle,
}: {
  title: string
  items: TitleCardDTO[]
  onOpenTitle(id: number): void
}) {
  if (items.length === 0) return null

  return (
    <View style={styles.rail}>
      <Text style={styles.railTitle}>{title}</Text>
      <FlatList
        horizontal
        data={items}
        keyExtractor={(item) => String(item.id)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.railContent}
        renderItem={({ item }) => (
          <TitleCard title={item} onPress={() => onOpenTitle(item.id)} />
        )}
      />
    </View>
  )
}

// ─────────────────────────────────────────────────────────────
//  SearchScreen
// ─────────────────────────────────────────────────────────────

export function SearchScreen({ onOpenTitle }: { onOpenTitle(id: number): void }) {
  const [query, setQuery] = React.useState('')
  const [items, setItems] = React.useState<TitleCardDTO[]>([])
  const [trending, setTrending] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    api.search
      .trending(10)
      .then(setTrending)
      .catch(() => undefined)
  }, [])

  React.useEffect(() => {
    if (!query.trim()) {
      setItems([])
      return undefined
    }

    let cancelled = false
    setLoading(true)
    const timer = setTimeout(() => {
      api.search
        .search({ q: query.trim(), perPage: 40 })
        .then((result) => {
          if (!cancelled) setItems(result.items)
        })
        .catch(() => {
          if (!cancelled) setItems([])
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  return (
    <View style={styles.screen}>
      <View style={styles.searchBar}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Фильмы, сериалы, аниме…"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Поисковый запрос"
        />
      </View>

      {loading ? (
        <LoadingState label="Ищем" />
      ) : query.trim() ? (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>По запросу «{query}» ничего не найдено</Text>
          }
          renderItem={({ item }) => (
            <TitleCard title={item} onPress={() => onOpenTitle(item.id)} width={160} />
          )}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.screenContent}>
          <Text style={styles.railTitle}>Популярные запросы</Text>
          <View style={styles.chipsRow}>
            {trending.map((item) => (
              <Pressable
                key={item}
                onPress={() => setQuery(item)}
                style={styles.chip}
                accessibilityRole="button"
              >
                <Text style={styles.chipText}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  )
}

// ─────────────────────────────────────────────────────────────
//  TitleScreen
// ─────────────────────────────────────────────────────────────

export function TitleScreen({
  titleId,
  onPlay,
  onBack,
}: {
  titleId: number
  onPlay(params: { title: TitleDTO; sources: PlayerSource[]; episodes: EpisodeDTO[] }): void
  onBack(): void
}) {
  const [title, setTitle] = React.useState<TitleDTO | null>(null)
  const [episodes, setEpisodes] = React.useState<EpisodeDTO[]>([])
  const [offline, setOffline] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [selectedSeason, setSelectedSeason] = React.useState(1)

  const { isAuthenticated } = useAuth()
  const { bookmarked, burst, toggle } = useBookmark(titleId, isAuthenticated)

  const heartScale = useSharedValue(1)
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }))

  React.useEffect(() => {
    if (burst) {
      heartScale.value = withSequence(
        withSpring(1.35, { damping: 8 }),
        withSpring(0.92, { damping: 8 }),
        withSpring(1, { damping: 10 }),
      )
    }
  }, [burst, heartScale])

  React.useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const online = await downloadService.isOnline()
        if (online) {
          const [detail, list] = await Promise.all([
            api.titles.byId(titleId),
            api.titles.episodes(titleId).catch(() => []),
          ])
          if (cancelled) return
          setTitle(detail)
          setEpisodes(list)
          setOffline(false)
          return
        }
      } catch {
        // Переходим к офлайн-копии
      }

      const cached = await downloadService.getOfflineTitle(titleId)
      if (cancelled) return
      if (cached) {
        setTitle(cached.title)
        setEpisodes(cached.episodes)
        setOffline(true)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [titleId])

  const saveOffline = async () => {
    setSaving(true)
    await downloadService.saveTitle(titleId)
    setSaving(false)
  }

  const play = async () => {
    if (!title) return
    try {
      const result = await api.titles.sources(titleId)
      onPlay({ title, sources: result.sources, episodes })
    } catch {
      onPlay({ title, sources: [], episodes })
    }
  }

  if (!title) return <LoadingState label="Открываем тайтл" />

  const seasons = [...new Set(episodes.map((episode) => episode.season))].sort((a, b) => a - b)
  const seasonEpisodes = episodes.filter((episode) => episode.season === selectedSeason)

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.titleContent}>
      <Pressable onPress={onBack} accessibilityRole="button" style={styles.backButton}>
        <Text style={styles.backText}>← Назад</Text>
      </Pressable>

      {title.backdropUrl ? (
        <Image source={{ uri: title.backdropUrl }} style={styles.titleBackdrop} resizeMode="cover" />
      ) : null}

      <View style={styles.titleHeader}>
        <Image source={{ uri: title.posterUrl }} style={styles.titlePoster} resizeMode="cover" />
        <View style={styles.titleInfo}>
          <Text style={styles.titleName}>{title.title}</Text>
          {title.originalTitle ? (
            <Text style={styles.titleOriginal}>{title.originalTitle}</Text>
          ) : null}
          <Text style={styles.titleMeta}>
            {title.year}
            {title.duration ? ` · ${title.duration} мин` : ''}
            {offline ? ' · офлайн' : ''}
          </Text>

          <View style={styles.titleRatingRow}>
            <View style={styles.ratingPill}>
              <Text style={styles.ratingPillText}>
                КП {title.ratingKp ? title.ratingKp.toFixed(1) : '—'}
              </Text>
            </View>
            {title.ratingImdb ? (
              <View style={[styles.ratingPill, styles.ratingPillImdb]}>
                <Text style={styles.ratingPillText}>IMDb {title.ratingImdb.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.titleActions}>
        <GradientButton label="Смотреть" onPress={() => void play()} />

        <Animated.View style={heartStyle}>
          <Pressable
            onPress={() => void toggle()}
            style={[styles.outlineButton, bookmarked && styles.outlineButtonActive]}
            accessibilityRole="button"
            accessibilityLabel={bookmarked ? 'Убрать из закладок' : 'В закладки'}
          >
            <Text style={styles.outlineButtonText}>{bookmarked ? '♥ В закладках' : '♡ В закладки'}</Text>
          </Pressable>
        </Animated.View>
      </View>

      <Pressable
        onPress={() => void saveOffline()}
        style={styles.outlineButton}
        accessibilityRole="button"
      >
        <Text style={styles.outlineButtonText}>
          {saving ? 'Сохраняем…' : 'Скачать для офлайна'}
        </Text>
      </Pressable>

      {title.description ? <Text style={styles.titleDescription}>{title.description}</Text> : null}

      <View style={styles.genreRow}>
        {title.genres.map((genre) => (
          <View key={genre} style={styles.chip}>
            <Text style={styles.chipText}>{genre}</Text>
          </View>
        ))}
      </View>

      {seasons.length > 0 ? (
        <View style={styles.episodesBlock}>
          <Text style={styles.railTitle}>Серии</Text>

          {seasons.length > 1 ? (
            <FlatList
              horizontal
              data={seasons}
              keyExtractor={(item) => String(item)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.railContent}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setSelectedSeason(item)}
                  style={[styles.chip, item === selectedSeason && styles.chipActive]}
                >
                  <Text style={styles.chipText}>Сезон {item}</Text>
                </Pressable>
              )}
            />
          ) : null}

          <View style={styles.episodesGrid}>
            {seasonEpisodes.map((episode) => (
              <Pressable
                key={episode.id}
                onPress={() => void play()}
                style={styles.episodeButton}
                accessibilityRole="button"
              >
                <Text style={styles.episodeButtonText}>{episode.episode}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  )
}

// ─────────────────────────────────────────────────────────────
//  BookmarksScreen
// ─────────────────────────────────────────────────────────────

export function BookmarksScreen({ onOpenTitle }: { onOpenTitle(id: number): void }) {
  const [items, setItems] = React.useState<BookmarkDTO[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    api.user
      .bookmarks(1, 100)
      .then((result) => {
        if (!cancelled) setItems(result.items)
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <LoadingState label="Загружаем закладки" />

  return (
    <FlatList
      style={styles.screen}
      data={items}
      keyExtractor={(item) => String(item.id)}
      numColumns={2}
      columnWrapperStyle={styles.gridRow}
      contentContainerStyle={styles.gridContent}
      ListHeaderComponent={<Text style={styles.screenTitle}>Закладки</Text>}
      ListEmptyComponent={<Text style={styles.emptyText}>Закладок пока нет</Text>}
      renderItem={({ item }) => (
        <TitleCard title={item.title} onPress={() => onOpenTitle(item.titleId)} width={160} />
      )}
    />
  )
}

// ─────────────────────────────────────────────────────────────
//  HistoryScreen
// ─────────────────────────────────────────────────────────────

export function HistoryScreen({ onOpenTitle }: { onOpenTitle(id: number): void }) {
  const [items, setItems] = React.useState<ViewHistoryDTO[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    api.user
      .history(1, 100)
      .then((result) => {
        if (!cancelled) setItems(result.items)
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <LoadingState label="Загружаем историю" />

  return (
    <FlatList
      style={styles.screen}
      data={items}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.screenContent}
      ListHeaderComponent={<Text style={styles.screenTitle}>История</Text>}
      ListEmptyComponent={<Text style={styles.emptyText}>История пуста</Text>}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onOpenTitle(item.titleId)}
          style={styles.historyRow}
          accessibilityRole="button"
        >
          <Image source={{ uri: item.title.posterUrl }} style={styles.historyPoster} />
          <View style={styles.historyInfo}>
            <Text style={styles.historyTitle} numberOfLines={1}>
              {item.title.title}
            </Text>
            <Text style={styles.historyMeta}>
              {new Date(item.watchedAt).toLocaleDateString('ru-RU')}
              {item.season ? ` · Сезон ${item.season}` : ''}
              {item.episode ? ` · Серия ${item.episode}` : ''}
            </Text>
          </View>
        </Pressable>
      )}
    />
  )
}

// ─────────────────────────────────────────────────────────────
//  DownloadsScreen — офлайн-загрузки
// ─────────────────────────────────────────────────────────────

export function DownloadsScreen({ onOpenTitle }: { onOpenTitle(id: number): void }) {
  const [items, setItems] = React.useState<TitleCardDTO[]>([])
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    setItems(await downloadService.getOfflineTitles())
    setLoading(false)
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  const sync = async () => {
    setLoading(true)
    await downloadService.cacheCatalog()
    await load()
  }

  if (loading) return <LoadingState label="Читаем офлайн-каталог" />

  return (
    <FlatList
      style={styles.screen}
      data={items}
      keyExtractor={(item) => String(item.id)}
      numColumns={2}
      columnWrapperStyle={styles.gridRow}
      contentContainerStyle={styles.gridContent}
      ListHeaderComponent={
        <View>
          <Text style={styles.screenTitle}>Офлайн</Text>
          <Pressable onPress={() => void sync()} style={styles.outlineButton}>
            <Text style={styles.outlineButtonText}>Обновить кэш каталога</Text>
          </Pressable>
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.emptyText}>
          Сохранённых тайтлов нет. Откройте тайтл и нажмите «Скачать для офлайна».
        </Text>
      }
      renderItem={({ item }) => (
        <TitleCard title={item} onPress={() => onOpenTitle(item.id)} width={160} />
      )}
    />
  )
}

// ─────────────────────────────────────────────────────────────
//  ProfileScreen
// ─────────────────────────────────────────────────────────────

export function ProfileScreen() {
  const { user, isAuthenticated, logout, loading } = useAuth()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const { login } = useAuth()

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      await login(email.trim(), password)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось войти')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <LoadingState label="Проверяем сессию" />

  if (!isAuthenticated) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
        <Text style={styles.screenTitle}>Вход в KINOOX</Text>
        <Text style={styles.emptyText}>
          Войдите, чтобы закладки и история синхронизировались между устройствами.
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Пароль"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          style={styles.input}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <GradientButton label={busy ? 'Входим…' : 'Войти'} onPress={() => void submit()} loading={busy} />
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <Text style={styles.screenTitle}>Профиль</Text>

      <View style={styles.profileCard}>
        <LinearGradient
          colors={[colors.fluxFrom, colors.fluxTo]}
          style={styles.profileAvatar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.profileAvatarText}>{user?.username.slice(0, 1).toUpperCase()}</Text>
        </LinearGradient>
        <View>
          <Text style={styles.profileName}>{user?.username}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>
      </View>

      <Pressable
        onPress={() => void notificationService.register()}
        style={styles.outlineButton}
        accessibilityRole="button"
      >
        <Text style={styles.outlineButtonText}>Включить уведомления о сериях</Text>
      </Pressable>

      <Pressable
        onPress={() => void Linking.openURL('https://kinoox.ru/download')}
        style={styles.outlineButton}
        accessibilityRole="button"
      >
        <Text style={styles.outlineButtonText}>Приложения для других устройств</Text>
      </Pressable>

      <Pressable onPress={() => void logout()} style={styles.dangerButton} accessibilityRole="button">
        <Text style={styles.dangerButtonText}>Выйти из аккаунта</Text>
      </Pressable>

      <Text style={styles.versionText}>KINOOX для Android и iOS · версия 1.0.0</Text>
    </ScrollView>
  )
}

// ─────────────────────────────────────────────────────────────
//  Стили
// ─────────────────────────────────────────────────────────────

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.void },
  screenContent: { padding: layout.screenPadding, paddingBottom: 48 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.void },

  loadingLogo: { width: 72, height: 72, borderRadius: 24 },
  loadingLabel: {
    marginTop: 16,
    color: colors.textMuted,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  homeHero: { paddingVertical: 36, paddingHorizontal: layout.screenPadding, marginBottom: 8 },
  heroWordmark: {
    color: colors.textPrimary,
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: 8,
  },
  heroSlogan: { marginTop: 8, color: colors.textSecondary, fontSize: 14 },

  rail: { marginTop: 20 },
  railTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: layout.screenPadding,
  },
  railContent: { paddingHorizontal: layout.screenPadding, gap: 12 },

  cardPosterWrap: {
    borderRadius: layout.radiusCard,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.frost,
  },
  cardPoster: { width: '100%', aspectRatio: 2 / 3 },
  cardPosterFallback: { backgroundColor: colors.frost },
  cardVeil: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
    backgroundColor: 'rgba(6,7,10,0.55)',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBadgeHigh: { backgroundColor: colors.fluxFrom },
  ratingBadgeLow: { backgroundColor: 'rgba(74,80,104,0.65)' },
  ratingText: { color: colors.textPrimary, fontSize: 12, fontWeight: '600' },
  ratingTextHigh: { color: colors.void },
  cardTitle: { marginTop: 8, color: colors.textPrimary, fontSize: 13, fontWeight: '500' },
  cardMeta: { marginTop: 2, color: colors.textMuted, fontSize: 11 },

  gradientButton: {
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  gradientButtonText: { color: colors.void, fontSize: 15, fontWeight: '700' },
  prismButtonText: { color: colors.textPrimary },

  outlineButton: {
    marginTop: 10,
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.frost,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  outlineButtonActive: { borderColor: colors.fluxFrom },
  outlineButtonText: { color: colors.textPrimary, fontSize: 14, fontWeight: '500' },

  dangerButton: {
    marginTop: 20,
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,69,58,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonText: { color: colors.danger, fontSize: 14, fontWeight: '500' },

  skeleton: { backgroundColor: colors.surface },
  skeletonLine: { height: 12, marginTop: 8, borderRadius: 6 },

  searchBar: { padding: layout.screenPadding },
  searchInput: {
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.frost,
    backgroundColor: colors.abyss,
    paddingHorizontal: 20,
    color: colors.textPrimary,
  },
  gridRow: { gap: 12, paddingHorizontal: layout.screenPadding },
  gridContent: { paddingVertical: 16, gap: 16, paddingBottom: 48 },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: layout.screenPadding,
    marginTop: 24,
  },
  screenTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '700',
    paddingHorizontal: layout.screenPadding,
    marginBottom: 16,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: layout.screenPadding },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.frost,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { borderColor: colors.prismFrom },
  chipText: { color: colors.textSecondary, fontSize: 13 },

  titleContent: { paddingBottom: 48 },
  backButton: { paddingHorizontal: layout.screenPadding, paddingVertical: 12 },
  backText: { color: colors.textSecondary, fontSize: 14 },
  titleBackdrop: { width: '100%', height: 200 },
  titleHeader: { flexDirection: 'row', gap: 16, padding: layout.screenPadding },
  titlePoster: { width: 120, height: 180, borderRadius: layout.radiusCard },
  titleInfo: { flex: 1 },
  titleName: { color: colors.textPrimary, fontSize: 22, fontWeight: '700' },
  titleOriginal: { marginTop: 4, color: colors.textMuted, fontSize: 12 },
  titleMeta: { marginTop: 8, color: colors.textSecondary, fontSize: 13 },
  titleRatingRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  ratingPill: {
    borderRadius: 999,
    backgroundColor: colors.fluxFrom,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ratingPillImdb: { backgroundColor: colors.prismFrom },
  ratingPillText: { color: colors.textPrimary, fontSize: 12, fontWeight: '600' },
  titleActions: { paddingHorizontal: layout.screenPadding },
  titleDescription: {
    marginTop: 16,
    paddingHorizontal: layout.screenPadding,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: layout.screenPadding,
    marginTop: 16,
  },
  episodesBlock: { marginTop: 24 },
  episodesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: layout.screenPadding,
  },
  episodeButton: {
    minWidth: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.frost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  episodeButtonText: { color: colors.textPrimary, fontSize: 13, fontWeight: '600' },

  historyRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: layout.screenPadding,
  },
  historyPoster: { width: 56, height: 84, borderRadius: 12, backgroundColor: colors.surface },
  historyInfo: { flex: 1 },
  historyTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '500' },
  historyMeta: { marginTop: 4, color: colors.textMuted, fontSize: 12 },

  input: {
    height: 48,
    borderRadius: layout.radiusControl,
    borderWidth: 1,
    borderColor: colors.frost,
    backgroundColor: colors.abyss,
    paddingHorizontal: 16,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  errorText: { color: colors.danger, fontSize: 13, marginBottom: 12 },

  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: { color: colors.void, fontSize: 24, fontWeight: '700' },
  profileName: { color: colors.textPrimary, fontSize: 18, fontWeight: '600' },
  profileEmail: { marginTop: 2, color: colors.textMuted, fontSize: 12 },
  versionText: { marginTop: 24, color: colors.textMuted, fontSize: 11, textAlign: 'center' },

  /** Стеклянная поверхность: blur(20px) saturate(1.5) */
  glass: {
    backgroundColor: 'rgba(12,14,20,0.72)',
    borderWidth: 1,
    borderColor: colors.frost,
    overflow: 'hidden',
  },
})

/** BlurView с параметрами дизайн-системы: blur(20px) saturate(1.5) */
export function GlassSurface({ children }: { children: React.ReactNode }) {
  return (
    <BlurView intensity={40} tint="dark" style={styles.glass}>
      {children}
    </BlurView>
  )
}
