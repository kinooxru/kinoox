/**
 * Наполнение базы KINOOX.
 *
 * Запуск: pnpm --filter @kinoox/api db:seed
 *
 * Сид идемпотентен: повторный запуск обновляет существующие записи,
 * а не создаёт дубли.
 */
import { PrismaClient, type TitleType, type TitleStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

interface SeedTitle {
  kpId: number
  imdbId: string | null
  type: TitleType
  title: string
  originalTitle: string
  description: string
  year: number
  ratingKp: number
  ratingImdb: number
  duration: number | null
  countries: string[]
  genres: string[]
  actors: string[]
  directors: string[]
  status: TitleStatus
  viewsCount: number
  /** Путь к постеру на image.tmdb.org, без домена и размера */
  posterPath: string
  /** Путь к широкоформатному изображению на image.tmdb.org */
  backdropPath: string
  seasons?: Array<{ season: number; episodes: number; names?: string[] }>
}

/**
 * Путь к локальному постеру: файлы генерирует scripts/generate-posters.mjs
 * в apps/web/public/posters. Локальные изображения не зависят от внешних CDN.
 */
function localPoster(titleId: number): string {
  return `/posters/${titleId}.svg`
}

/** Путь к локальному backdrop для шапки страницы тайтла */
function localBackdrop(titleId: number): string {
  return `/backdrops/${titleId}.svg`
}

const SEED_TITLES: SeedTitle[] = [
  {
    kpId: 301,
    imdbId: 'tt0133093',
    type: 'movie',
    title: 'Матрица',
    originalTitle: 'The Matrix',
    description:
      'Хакер Нео узнаёт, что окружающий мир — иллюзия, созданная машинами. Он присоединяется к восстанию против системы.',
    year: 1999,
    ratingKp: 8.5,
    ratingImdb: 8.7,
    duration: 136,
    countries: ['США', 'Австралия'],
    genres: ['фантастика', 'боевик'],
    actors: ['Киану Ривз', 'Лоренс Фишбёрн', 'Кэрри-Энн Мосс'],
    directors: ['Лана Вачовски', 'Лилли Вачовски'],
    status: 'released',
    viewsCount: 184_320,
    posterPath: '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    backdropPath: '/icmmSD4vTTDKOq2vvdulafOGw93.jpg',
  },
  {
    kpId: 464963,
    imdbId: 'tt0944947',
    type: 'serial',
    title: 'Игра престолов',
    originalTitle: 'Game of Thrones',
    description:
      'Девять знатных домов борются за контроль над Вестеросом, пока древняя угроза пробуждается за Стеной.',
    year: 2011,
    ratingKp: 9.0,
    ratingImdb: 9.2,
    duration: 57,
    countries: ['США', 'Великобритания'],
    genres: ['фэнтези', 'драма', 'приключения'],
    actors: ['Эмилия Кларк', 'Питер Динклэйдж', 'Кит Харингтон'],
    directors: ['Дэвид Бениофф', 'Д. Б. Уайсс'],
    status: 'released',
    viewsCount: 421_990,
    posterPath: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
    backdropPath: '/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg',
    seasons: [
      { season: 1, episodes: 10 },
      { season: 2, episodes: 10 },
      { season: 3, episodes: 10 },
    ],
  },
  {
    kpId: 258687,
    imdbId: 'tt0816692',
    type: 'movie',
    title: 'Интерстеллар',
    originalTitle: 'Interstellar',
    description:
      'Группа исследователей отправляется через червоточину в поисках нового дома для человечества.',
    year: 2014,
    ratingKp: 8.6,
    ratingImdb: 8.7,
    duration: 169,
    countries: ['США', 'Великобритания'],
    genres: ['фантастика', 'драма', 'приключения'],
    actors: ['Мэттью МакКонахи', 'Энн Хэтэуэй', 'Джессика Честейн'],
    directors: ['Кристофер Нолан'],
    status: 'released',
    viewsCount: 267_410,
    posterPath: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdropPath: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
  },
  {
    kpId: 749374,
    imdbId: 'tt2560140',
    type: 'anime',
    title: 'Атака титанов',
    originalTitle: 'Shingeki no Kyojin',
    description:
      'Человечество укрылось за огромными стенами от титанов. Юный Эрен клянётся уничтожить их всех.',
    year: 2013,
    ratingKp: 8.8,
    ratingImdb: 9.1,
    duration: 24,
    countries: ['Япония'],
    genres: ['аниме', 'боевик', 'драма'],
    actors: ['Юки Кадзи', 'Марина Иноуэ', 'Юи Исикава'],
    directors: ['Тэцуро Араки'],
    status: 'ongoing',
    viewsCount: 398_120,
    posterPath: '/hTP1DtLGFamjfu8WqjnuQdP1n4Z.jpg',
    backdropPath: '/rqbCbjB19amtOtFQbb3K2lgm2zv.jpg',
    seasons: [
      { season: 1, episodes: 25 },
      { season: 2, episodes: 12 },
      { season: 3, episodes: 22 },
    ],
  },
  {
    kpId: 326,
    imdbId: 'tt0111161',
    type: 'movie',
    title: 'Побег из Шоушенка',
    originalTitle: 'The Shawshank Redemption',
    description:
      'Банкир Энди Дюфрейн осуждён за преступление, которого не совершал, и находит способ сохранить себя в тюрьме.',
    year: 1994,
    ratingKp: 9.1,
    ratingImdb: 9.3,
    duration: 142,
    countries: ['США'],
    genres: ['драма'],
    actors: ['Тим Роббинс', 'Морган Фриман', 'Боб Гантон'],
    directors: ['Фрэнк Дарабонт'],
    status: 'released',
    viewsCount: 512_770,
    posterPath: '/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg',
    backdropPath: '/zfbjgQE1uSd9wiPTX4VzsLi0rGG.jpg',
  },
  {
    kpId: 389,
    imdbId: 'tt0110413',
    type: 'movie',
    title: 'Леон',
    originalTitle: 'Léon: The Professional',
    description:
      'Наёмный убийца Леон берёт под опеку девочку, потерявшую семью, и учит её своему ремеслу.',
    year: 1994,
    ratingKp: 8.7,
    ratingImdb: 8.5,
    duration: 110,
    countries: ['Франция'],
    genres: ['боевик', 'драма', 'криминал'],
    actors: ['Жан Рено', 'Натали Портман', 'Гэри Олдмен'],
    directors: ['Люк Бессон'],
    status: 'released',
    viewsCount: 233_890,
    posterPath: '/yI6X2cCM5YPJtxMhUd3dPGqDAhw.jpg',
    backdropPath: '/jRJrQ72VLyEnVsvwfep8Xjlvu8c.jpg',
  },
  {
    kpId: 740,
    imdbId: 'tt0114709',
    type: 'cartoon',
    title: 'История игрушек',
    originalTitle: 'Toy Story',
    description:
      'Ковбой Вуди и космический рейнджер Базз Лайтер учатся дружить, пока хозяин не видит.',
    year: 1995,
    ratingKp: 8.3,
    ratingImdb: 8.3,
    duration: 81,
    countries: ['США'],
    genres: ['мультфильм', 'комедия', 'приключения'],
    actors: ['Том Хэнкс', 'Тим Аллен', 'Дон Риклз'],
    directors: ['Джон Лассетер'],
    status: 'released',
    viewsCount: 154_220,
    posterPath: '/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg',
    backdropPath: '/dK2EexhFyBEeTGzP0DzXjHr7Rbd.jpg',
  },
  {
    // kp_id не из каталога Vibix: сериал проверяется через VeoVeo
    kpId: 1044002,
    imdbId: null,
    type: 'serial',
    title: 'Слово пацана. Кровь на асфальте',
    originalTitle: 'Слово пацана',
    description:
      'Казань конца 1980-х: уличные группировки делят районы, а подросток пытается найти своё место.',
    year: 2023,
    ratingKp: 8.4,
    ratingImdb: null as unknown as number,
    duration: 50,
    countries: ['Россия'],
    genres: ['драма', 'криминал'],
    actors: ['Иван Янковский', 'Леон Кемстач', 'Рузиль Минекаев'],
    directors: ['Жора Крыжовников'],
    status: 'released',
    viewsCount: 289_430,
    posterPath: '/1mJLNn8GOdWhA1l2s1a1mAhGydk.jpg',
    backdropPath: '/c1C4Kln1KnsvevrLGPRQvCZzcGM.jpg',
    seasons: [{ season: 1, episodes: 8 }],
  },
  {
    // kp_id не из каталога Vibix: аниме проверяется через VeoVeo
    kpId: 4291858,
    imdbId: null,
    type: 'anime',
    title: 'Магическая битва',
    originalTitle: 'Jujutsu Kaisen',
    description:
      'Студент Юдзи Итадори проглатывает проклятый палец и становится сосудом древнего проклятия.',
    year: 2020,
    ratingKp: 8.6,
    ratingImdb: 8.6,
    duration: 24,
    countries: ['Япония'],
    genres: ['аниме', 'фэнтези', 'боевик'],
    actors: ['Джунья Эноки', 'Юма Учида', 'Юичи Накамура'],
    directors: ['Сунэй Катаока'],
    status: 'ongoing',
    viewsCount: 312_640,
    posterPath: '/fHp3a8pVBR1lS387lAqLXqLXqLX.jpg',
    backdropPath: '/jX4NfzHNnIc1vxUJqx1Z9XU9wjk.jpg',
    seasons: [
      { season: 1, episodes: 24 },
      { season: 2, episodes: 23 },
    ],
  },
  {
    kpId: 775276,
    imdbId: 'tt7286456',
    type: 'movie',
    title: 'Джокер',
    originalTitle: 'Joker',
    description:
      'История превращения неудачливого комика Артура Флека в самого опасного преступника Готэма.',
    year: 2019,
    ratingKp: 8.2,
    ratingImdb: 8.4,
    duration: 122,
    countries: ['США', 'Канада'],
    genres: ['драма', 'триллер', 'криминал'],
    actors: ['Хоакин Феникс', 'Роберт Де Ниро', 'Зази Битц'],
    directors: ['Тодд Филлипс'],
    status: 'released',
    viewsCount: 341_050,
    posterPath: '/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg',
    backdropPath: '/n6bUvigpRFqSwmPp1m2YADdbRBc.jpg',
  },
  {
    kpId: 819101,
    imdbId: 'tt6751668',
    type: 'movie',
    title: 'Паразиты',
    originalTitle: '기생충',
    description:
      'Бедная семья постепенно проникает в дом богатых, и это приводит к непредсказуемым последствиям.',
    year: 2019,
    ratingKp: 8.4,
    ratingImdb: 8.5,
    duration: 132,
    countries: ['Южная Корея'],
    genres: ['драма', 'триллер', 'комедия'],
    actors: ['Сон Кан Хо', 'Ли Сон Гюн', 'Чо Ё Джон'],
    directors: ['Пон Джун Хо'],
    status: 'released',
    viewsCount: 198_760,
    posterPath: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    backdropPath: '/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg',
  },
  {
    // kp_id не из каталога Vibix: мультфильм проверяется через VeoVeo
    kpId: 1049129,
    imdbId: null,
    type: 'cartoon',
    title: 'Человек-паук: Паутина вселенных',
    originalTitle: 'Spider-Man: Across the Spider-Verse',
    description:
      'Майлз Моралес отправляется в мультивселенную и сталкивается с обществом пауков.',
    year: 2023,
    ratingKp: 8.5,
    ratingImdb: 8.5,
    duration: 140,
    countries: ['США'],
    genres: ['мультфильм', 'фантастика', 'приключения'],
    actors: ['Шамеик Мур', 'Хейли Стайнфелд', 'Оскар Айзек'],
    directors: ['Хоаким Дос Сантос', 'Кемп Пауэрс'],
    status: 'released',
    viewsCount: 176_540,
    posterPath: '/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    backdropPath: '/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
  },
]

const SEED_USERS = [
  {
    email: 'admin@kinoox.ru',
    username: 'admin',
    password: 'KinooxAdmin2026',
    role: 'admin',
  },
  {
    email: 'demo@kinoox.ru',
    username: 'demo',
    password: 'KinooxDemo2026',
    role: 'user',
  },
]

const SEED_APP_VERSIONS = [
  {
    platform: 'android',
    version: '1.0.0',
    size: '~25 МБ',
    minimumOs: 'Android 8.0+',
    changelog: [
      'Первый публичный релиз',
      'Каталог, плеер, закладки и история',
      'Офлайн-кэш описаний и постеров',
      'Push-уведомления о новых сериях',
    ],
  },
  {
    platform: 'ios',
    version: '1.0.0',
    size: '~30 МБ',
    minimumOs: 'iOS 14.0+',
    changelog: [
      'Первый публичный релиз',
      'Жесты управления плеером',
      'AirPlay и Picture-in-Picture',
      'Сплит-скрин на iPad',
    ],
  },
  {
    platform: 'windows',
    version: '1.0.0',
    size: '~8 МБ',
    minimumOs: 'Windows 10/11',
    changelog: [
      'Первый публичный релиз',
      'Мини-плеер поверх окон',
      'Системный трей и горячие клавиши',
      'Нативные уведомления',
    ],
  },
  {
    platform: 'macos',
    version: '1.0.0',
    size: '~7 МБ',
    minimumOs: 'macOS 11+',
    changelog: ['Первый публичный релиз', 'Touch Bar', 'Picture-in-Picture', 'Автозапуск'],
  },
  {
    platform: 'linux',
    version: '1.0.0',
    size: '~8 МБ',
    minimumOs: 'Ubuntu 20.04+, Fedora 35+',
    changelog: [
      'Первый публичный релиз',
      'AppImage без установки',
      'Пакеты .deb и .rpm',
      'Нативные уведомления и трей',
    ],
  },
]

async function seedUsers(): Promise<Map<string, number>> {
  const ids = new Map<string, number>()

  for (const user of SEED_USERS) {
    const passwordHash = await bcrypt.hash(user.password, 12)
    const record = await prisma.user.upsert({
      where: { email: user.email },
      create: {
        email: user.email,
        username: user.username,
        passwordHash,
        role: user.role,
      },
      update: { username: user.username, role: user.role },
    })
    ids.set(user.username, record.id)
  }

  console.log(`Пользователи: ${ids.size}`)
  return ids
}

async function seedTitles(): Promise<number[]> {
  const ids: number[] = []

  for (const [index, item] of SEED_TITLES.entries()) {
    const data = {
      kpId: item.kpId,
      imdbId: item.imdbId,
      type: item.type,
      title: item.title,
      originalTitle: item.originalTitle,
      description: item.description,
      // Постеры и backdrop — локальные SVG, сгенерированные scripts/generate-posters.mjs.
      // Номера файлов соответствуют порядку тайтлов в SEED_TITLES, начиная с 1.
      posterUrl: localPoster(index + 1),
      backdropUrl: localBackdrop(index + 1),
      year: item.year,
      ratingKp: item.ratingKp,
      ratingImdb: item.ratingImdb,
      duration: item.duration,
      countries: item.countries,
      genres: item.genres,
      actors: item.actors,
      directors: item.directors,
      status: item.status,
      viewsCount: item.viewsCount,
    }

    const title = await prisma.title.upsert({
      where: { kpId: item.kpId },
      create: data,
      update: data,
    })

    ids.push(title.id)

    if (item.seasons) {
      await prisma.episode.deleteMany({ where: { titleId: title.id } })
      await prisma.episode.createMany({
        data: item.seasons.flatMap((season) =>
          Array.from({ length: season.episodes }, (_, index) => ({
            titleId: title.id,
            season: season.season,
            episode: index + 1,
            name: season.names?.[index] ?? `Серия ${index + 1}`,
          })),
        ),
        skipDuplicates: true,
      })
    }

    // Источники: Vibix — приоритет 1, VeoVeo — приоритет 2
    await prisma.source.upsert({
      where: { titleId_balancer: { titleId: title.id, balancer: 'vibix' } },
      create: {
        titleId: title.id,
        balancer: 'vibix',
        balancerId: String(item.kpId),
        quality: '1080p',
        priority: 1,
      },
      update: { balancerId: String(item.kpId) },
    })

    await prisma.source.upsert({
      where: { titleId_balancer: { titleId: title.id, balancer: 'veoveo' } },
      create: {
        titleId: title.id,
        balancer: 'veoveo',
        balancerId: String(item.kpId),
        quality: '1080p',
        priority: 2,
      },
      update: { balancerId: String(item.kpId) },
    })
  }

  console.log(`Тайтлы: ${ids.length}`)
  return ids
}

async function seedAppVersions(): Promise<void> {
  for (const version of SEED_APP_VERSIONS) {
    await prisma.appVersion.upsert({
      where: { platform_version: { platform: version.platform, version: version.version } },
      create: {
        platform: version.platform,
        version: version.version,
        url: `/downloads/${version.platform}/kinoox-${version.version}`,
        size: version.size,
        minimumOs: version.minimumOs,
        changelog: version.changelog,
        isActive: true,
        downloadsCount: 0,
      },
      update: {
        size: version.size,
        minimumOs: version.minimumOs,
        changelog: version.changelog,
      },
    })
  }

  console.log(`Версии приложений: ${SEED_APP_VERSIONS.length}`)
}

async function seedActivity(titleIds: number[], userIds: Map<string, number>): Promise<void> {
  const demoId = userIds.get('demo')
  const adminId = userIds.get('admin')
  if (!demoId || !adminId) return

  // Закладки демо-пользователя
  const bookmarkPlan: Array<{ index: number; status: 'watching' | 'planned' | 'completed' }> = [
    { index: 1, status: 'watching' },
    { index: 3, status: 'watching' },
    { index: 5, status: 'completed' },
    { index: 8, status: 'planned' },
  ]

  for (const plan of bookmarkPlan) {
    const titleId = titleIds[plan.index]
    if (!titleId) continue
    await prisma.bookmark.upsert({
      where: { userId_titleId: { userId: demoId, titleId } },
      create: {
        userId: demoId,
        titleId,
        status: plan.status,
        lastSeason: plan.status === 'watching' ? 1 : null,
        lastEpisode: plan.status === 'watching' ? 3 : null,
      },
      update: { status: plan.status },
    })
  }

  // История просмотров
  for (const [offset, titleId] of titleIds.slice(0, 6).entries()) {
    await prisma.viewHistory.upsert({
      where: { userId_titleId: { userId: demoId, titleId } },
      create: {
        userId: demoId,
        titleId,
        season: offset % 2 === 0 ? 1 : null,
        episode: offset % 2 === 0 ? offset + 1 : null,
      },
      update: { watchedAt: new Date(Date.now() - offset * 3_600_000) },
    })
  }

  // Комментарии
  const comments = [
    'Отличный плеер, переключение источников работает мгновенно.',
    'Смотрю уже третий раз — картинка на высоте.',
    'Подскажите, будет ли продолжение?',
  ]

  for (const [index, text] of comments.entries()) {
    const titleId = titleIds[index]
    if (!titleId) continue
    const existing = await prisma.comment.findFirst({
      where: { titleId, userId: demoId, text },
      select: { id: true },
    })
    if (existing) continue
    await prisma.comment.create({
      data: { titleId, userId: demoId, text, likesCount: index * 4 },
    })
  }

  console.log('Активность демо-пользователя создана')
}

async function main(): Promise<void> {
  console.log('=== Наполнение базы KINOOX ===')

  const userIds = await seedUsers()
  const titleIds = await seedTitles()
  await seedAppVersions()
  await seedActivity(titleIds, userIds)

  console.log('=== Готово ===')
}

main()
  .catch((error) => {
    console.error('Ошибка наполнения базы:', error)
    process.exit(1)
  })
  .finally(() => {
    void prisma.$disconnect()
  })