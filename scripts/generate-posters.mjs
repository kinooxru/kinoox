/**
 * Генератор локальных постеров-заглушек.
 *
 * Создаёт SVG-файлы в apps/web/public/posters для каждого тайтла каталога,
 * чтобы интерфейс не зависел от внешних CDN постеров. Рисунок строится
 * из названия, года и типа: детерминированный «постер» в палитре
 * дизайн-системы «Cinematic Flow».
 *
 * Запуск: node scripts/generate-posters.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const POSTER_DIR = join(ROOT, 'apps', 'web', 'public', 'posters')
const BACKDROP_DIR = join(ROOT, 'apps', 'web', 'public', 'backdrops')

/** Тайтлы каталога: совпадают с prisma/seed.ts */
const TITLES = [
  { id: 1, kpId: 435, title: 'Матрица', original: 'The Matrix', year: 1999, type: 'Фильм', rating: 8.5, hue: 0 },
  { id: 2, kpId: 464963, title: 'Игра престолов', original: 'Game of Thrones', year: 2011, type: 'Сериал', rating: 9.0, hue: 210 },
  { id: 3, kpId: 258687, title: 'Интерстеллар', original: 'Interstellar', year: 2014, type: 'Фильм', rating: 8.6, hue: 195 },
  { id: 4, kpId: 462682, title: 'Атака титанов', original: 'Shingeki no Kyojin', year: 2013, type: 'Аниме', rating: 8.8, hue: 20 },
  { id: 5, kpId: 252050, title: 'Побег из Шоушенка', original: 'The Shawshank Redemption', year: 1994, type: 'Фильм', rating: 9.1, hue: 240 },
  { id: 6, kpId: 342, title: 'Леон', original: 'Léon: The Professional', year: 1994, type: 'Фильм', rating: 8.7, hue: 30 },
  { id: 7, kpId: 111543, title: 'История игрушек', original: 'Toy Story', year: 1995, type: 'Мультфильм', rating: 8.3, hue: 45 },
  { id: 8, kpId: 1044002, title: 'Слово пацана', original: 'Слово пацана. Кровь на асфальте', year: 2023, type: 'Сериал', rating: 8.4, hue: 285 },
  { id: 9, kpId: 4291858, title: 'Магическая битва', original: 'Jujutsu Kaisen', year: 2020, type: 'Аниме', rating: 8.6, hue: 265 },
  { id: 10, kpId: 775276, title: 'Джокер', original: 'Joker', year: 2019, type: 'Фильм', rating: 8.2, hue: 300 },
  { id: 11, kpId: 819101, title: 'Паразиты', original: '기생충', year: 2019, type: 'Фильм', rating: 8.4, hue: 150 },
  { id: 12, kpId: 1049129, title: 'Человек-паук', original: 'Across the Spider-Verse', year: 2023, type: 'Мультфильм', rating: 8.5, hue: 320 },
]

/** Экранирование текста для безопасной вставки в SVG */
function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Разбивает длинное название на строки по 14 символов */
function wrap(text, maxChars) {
  const words = text.split(' ')
  const lines = []
  let current = ''

  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars && current) {
      lines.push(current.trim())
      current = word
    } else {
      current = (current + ' ' + word).trim()
    }
  }
  if (current) lines.push(current)

  return lines.slice(0, 4)
}

/**
 * Постер 500×750: градиентный фон по акценту, крупная монограмма,
 * название, год и рейтинг в моноширинном шрифте.
 */
function posterSvg(item) {
  const { title, year, type, rating, hue, id } = item
  const lines = wrap(title, 15)
  const monogram = title.replace(/[^A-Za-zА-Яа-яЁё]/g, '').slice(0, 1).toUpperCase()
  const highRating = rating > 7

  const titleLines = lines
    .map(
      (line, index) =>
        `<tspan x="44" dy="${index === 0 ? 0 : 46}">${escapeXml(line)}</tspan>`,
    )
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 750" width="500" height="750" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <linearGradient id="bg${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue}, 68%, 22%)" />
      <stop offset="55%" stop-color="#0C0E14" />
      <stop offset="100%" stop-color="#06070A" />
    </linearGradient>
    <linearGradient id="accent${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FF3D6E" />
      <stop offset="100%" stop-color="#FF6B3D" />
    </linearGradient>
    <radialGradient id="glow${id}" cx="24%" cy="16%" r="58%">
      <stop offset="0%" stop-color="hsl(${hue}, 82%, 58%)" stop-opacity="0.42" />
      <stop offset="100%" stop-color="hsl(${hue}, 82%, 58%)" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="500" height="750" fill="url(#bg${id})" />
  <rect width="500" height="750" fill="url(#glow${id})" />

  <!-- Диагональные штрихи: кинематографичная текстура -->
  <g opacity="0.07" stroke="#F5F7FA" stroke-width="1">
    ${Array.from({ length: 16 }, (_, index) => `<line x1="${-200 + index * 56}" y1="750" x2="${60 + index * 56}" y2="0" />`).join('')}
  </g>

  <!-- Монограмма бренда -->
  <text x="44" y="300" font-family="Space Grotesk, Inter, sans-serif" font-size="230"
        font-weight="700" fill="#F5F7FA" opacity="0.09">${escapeXml(monogram)}</text>

  <!-- Верхняя строка: тип и год -->
  <text x="44" y="70" font-family="JetBrains Mono, monospace" font-size="19"
        letter-spacing="4" fill="rgba(245,247,250,0.55)">KINOOX</text>

  <!-- Рейтинг в круглом бейдже по центру справа -->
  <g transform="translate(410, 300)">
    <circle r="40" fill="${highRating ? `url(#accent${id})` : 'rgba(74,80,104,0.6)'}" />
    <text y="8" text-anchor="middle" font-family="JetBrains Mono, monospace"
          font-size="24" font-weight="600"
          fill="${highRating ? '#06070A' : '#F5F7FA'}">${rating.toFixed(1)}</text>
  </g>

  <!-- Название -->
  <text x="44" y="560" font-family="Space Grotesk, Inter, sans-serif" font-size="40"
        font-weight="700" fill="#F5F7FA" letter-spacing="-1">${titleLines}</text>

  <!-- Тип и год -->
  <text x="44" y="700" font-family="JetBrains Mono, monospace" font-size="20"
        letter-spacing="3" fill="rgba(139,146,168,0.9)">${escapeXml(type.toUpperCase())} · ${year}</text>

  <!-- Акцентная полоса снизу -->
  <rect x="0" y="742" width="500" height="8" fill="url(#accent${id})" />
</svg>
`
}

/** Широкоформатное изображение 1600×900 для шапки страницы тайтла */
function backdropSvg(item) {
  const { id, hue, title, original } = item

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <linearGradient id="bd${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue}, 62%, 20%)" />
      <stop offset="50%" stop-color="#0C0E14" />
      <stop offset="100%" stop-color="#06070A" />
    </linearGradient>
    <radialGradient id="bglow${id}" cx="72%" cy="24%" r="62%">
      <stop offset="0%" stop-color="hsl(${(hue + 40) % 360}, 84%, 60%)" stop-opacity="0.34" />
      <stop offset="100%" stop-color="hsl(${(hue + 40) % 360}, 84%, 60%)" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="fade${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#06070A" stop-opacity="0.25" />
      <stop offset="70%" stop-color="#06070A" stop-opacity="0.85" />
      <stop offset="100%" stop-color="#06070A" stop-opacity="1" />
    </linearGradient>
  </defs>

  <rect width="1600" height="900" fill="url(#bd${id})" />
  <rect width="1600" height="900" fill="url(#bglow${id})" />

  <g opacity="0.06" stroke="#F5F7FA" stroke-width="1">
    ${Array.from({ length: 26 }, (_, index) => `<line x1="${-600 + index * 90}" y1="900" x2="${200 + index * 90}" y2="0" />`).join('')}
  </g>

  <text x="120" y="470" font-family="Space Grotesk, Inter, sans-serif" font-size="96"
        font-weight="700" fill="rgba(245,247,250,0.08)">${escapeXml(title)}</text>
  ${original ? `<text x="122" y="530" font-family="Inter, sans-serif" font-size="34" fill="rgba(139,146,168,0.35)">${escapeXml(original)}</text>` : ''}

  <rect width="1600" height="900" fill="url(#fade${id})" />
</svg>
`
}

async function main() {
  await mkdir(POSTER_DIR, { recursive: true })
  await mkdir(BACKDROP_DIR, { recursive: true })

  for (const item of TITLES) {
    await writeFile(join(POSTER_DIR, `${item.id}.svg`), posterSvg(item), 'utf8')
    await writeFile(join(BACKDROP_DIR, `${item.id}.svg`), backdropSvg(item), 'utf8')
  }

  console.log(`Постеры: ${TITLES.length} файлов в apps/web/public/posters`)
  console.log(`Backdrops: ${TITLES.length} файлов в apps/web/public/backdrops`)
}

main().catch((error) => {
  console.error('Ошибка генерации постеров:', error)
  process.exit(1)
})
