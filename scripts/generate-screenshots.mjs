/**
 * Генератор макетов скриншотов приложений для страницы /download.
 *
 * Реальные снимки появятся после первых сборок. Пока создаём SVG-макеты
 * интерфейса в стиле «Cinematic Flow», чтобы галерея не показывала 404.
 * Заменить макет настоящим скриншотом можно, положив файл с тем же именем.
 *
 * Запуск: node scripts/generate-screenshots.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'apps', 'web', 'public', 'screenshots')

const MOBILE = { w: 360, h: 780 }
const DESKTOP = { w: 1280, h: 800 }

/** Платформа → список экранов (имя файла без расширения → подпись) */
const SCREENS = {
  android: { size: MOBILE, items: { '01-home': 'Главная', '02-title': 'Тайтл', '03-player': 'Плеер', '04-bookmarks': 'Закладки', '05-downloads': 'Офлайн' } },
  ios: { size: MOBILE, items: { '01-home': 'Главная', '02-title': 'Тайтл', '03-player': 'Плеер', '04-split-view': 'Split View', '05-profile': 'Профиль' } },
  windows: { size: DESKTOP, items: { '01-home': 'Каталог', '02-player': 'Плеер', '03-mini-player': 'Мини-плеер', '04-tray': 'Системный трей' } },
  macos: { size: DESKTOP, items: { '01-home': 'Каталог', '02-player': 'Плеер', '03-touchbar': 'Touch Bar' } },
  linux: { size: DESKTOP, items: { '01-home': 'Каталог', '02-player': 'Плеер', '03-tray': 'Системный трей' } },
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function card(x, y, w, h, hue) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="hsl(${hue},55%,22%)" />
  <rect x="${x}" y="${y + h - 34}" width="${w * 0.7}" height="8" rx="4" fill="rgba(245,247,250,0.55)" />
  <rect x="${x}" y="${y + h - 18}" width="${w * 0.4}" height="6" rx="3" fill="rgba(139,146,168,0.55)" />`
}

function screenSvg(platform, name, label, { w, h }) {
  const mobile = w < h
  const cols = mobile ? 2 : 6
  const pad = mobile ? 20 : 40
  const gap = mobile ? 12 : 20
  const cw = (w - pad * 2 - gap * (cols - 1)) / cols
  const ch = cw * 1.5
  const top = mobile ? 150 : 150
  const rows = mobile ? 3 : 3

  let cards = ''
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const hue = (r * 47 + c * 61 + name.length * 13) % 360
      cards += card(pad + c * (cw + gap), top + r * (ch + gap + 8), cw, ch, hue)
    }
  }

  const title = mobile ? 26 : 34
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="KINOOX ${esc(platform)}: ${esc(label)}">
  <defs>
    <linearGradient id="flux" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF3D6E"/><stop offset="1" stop-color="#FF6B3D"/></linearGradient>
    <linearGradient id="fp" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FF3D6E"/><stop offset="1" stop-color="#7C5CFF"/></linearGradient>
    <radialGradient id="g1" cx="15%" cy="8%" r="60%"><stop offset="0" stop-color="#FF3D6E" stop-opacity="0.22"/><stop offset="1" stop-color="#FF3D6E" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="90%" cy="25%" r="55%"><stop offset="0" stop-color="#7C5CFF" stop-opacity="0.2"/><stop offset="1" stop-color="#7C5CFF" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#06070A"/>
  <rect width="${w}" height="${h}" fill="url(#g1)"/>
  <rect width="${w}" height="${h}" fill="url(#g2)"/>

  <text x="${pad}" y="64" font-family="Space Grotesk, Inter, sans-serif" font-size="${title}" font-weight="700" letter-spacing="6" fill="#F5F7FA">KINOOX</text>
  <text x="${pad}" y="98" font-family="Inter, sans-serif" font-size="14" fill="#8B92A8">${esc(label)} · ${esc(platform)}</text>
  <rect x="${pad}" y="116" width="${mobile ? 120 : 220}" height="3" rx="2" fill="url(#fp)"/>

  ${cards}

  ${
    mobile
      ? `<rect x="0" y="${h - 64}" width="${w}" height="64" fill="rgba(12,14,20,0.9)"/>
  <rect x="${w / 2 - 28}" y="${h - 14}" width="56" height="3" rx="2" fill="url(#fp)"/>`
      : `<rect x="0" y="0" width="${w}" height="36" fill="rgba(12,14,20,0.85)"/>
  <circle cx="22" cy="18" r="6" fill="url(#flux)"/>`
  }
</svg>
`
}

for (const [platform, { size, items }] of Object.entries(SCREENS)) {
  const dir = join(OUT, platform)
  await mkdir(dir, { recursive: true })
  for (const [name, label] of Object.entries(items)) {
    await writeFile(join(dir, `${name}.svg`), screenSvg(platform, name, label, size), 'utf8')
  }
  console.log(`${platform}: ${Object.keys(items).length} файлов`)
}
