/**
 * Генератор бинарных иконок бренда KINOOX:
 *  - apps/web/public/brand/favicon.ico (валидный ICO 32×32)
 *  - apps/web/public/favicon.ico (копия в корень)
 *  - apps/web/public/brand/apple-icon.png (PNG 180×180)
 *  - apps/web/public/brand/og-image.png (PNG 1200×630)
 *
 * Создаёт чистые PNG и ICO без сторонних зависимостей (pure Node.js + zlib).
 * Палитра: фирменный градиент flux (#FF3D6E → #FF6B3D) на фоне void (#06070A).
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BRAND = join(ROOT, 'apps', 'web', 'public', 'brand')
const PUBLIC = join(ROOT, 'apps', 'web', 'public')

const CRC_TABLE = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  CRC_TABLE[n] = c
}

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function makePng(width, height, pixelFn) {
  const stride = width * 4 + 1
  const raw = Buffer.alloc(stride * height)

  for (let y = 0; y < height; y++) {
    const rowOffset = y * stride
    raw[rowOffset] = 0 // filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height)
      const px = rowOffset + 1 + x * 4
      raw[px] = r
      raw[px + 1] = g
      raw[px + 2] = b
      raw[px + 3] = a
    }
  }

  const idatData = deflateSync(raw)

  function chunk(type, data) {
    const len = data.length
    const buf = Buffer.alloc(12 + len)
    buf.writeUInt32BE(len, 0)
    buf.write(type, 4, 4, 'ascii')
    data.copy(buf, 8)
    const crc = crc32(buf.subarray(4, 8 + len))
    buf.writeUInt32BE(crc, 8 + len)
    return buf
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  ihdr[10] = 0 // deflate
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // no interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function makeIco(pngBuffer, width, height) {
  // ICO header: 6 bytes
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: ICO
  header.writeUInt16LE(1, 4) // count: 1 image

  // Directory entry: 16 bytes
  const dir = Buffer.alloc(16)
  dir[0] = width >= 256 ? 0 : width
  dir[1] = height >= 256 ? 0 : height
  dir[2] = 0 // color count
  dir[3] = 0 // reserved
  dir[4] = 1 // planes
  dir[5] = 32 // bit count
  dir.writeUInt32LE(pngBuffer.length, 8) // size of image data
  dir.writeUInt32LE(22, 12) // offset (6 + 16 = 22)

  return Buffer.concat([header, dir, pngBuffer])
}

// Рендер иконки KINOOX: круглый знак flux (#FF3D6E → #FF6B3D) на фоне void (#06070A)
function iconPixel(x, y, w, h) {
  const cx = w / 2
  const cy = h / 2
  const r = Math.min(w, h) / 2
  const dx = x - cx
  const dy = y - cy
  const dist = Math.sqrt(dx * dx + dy * dy)

  // Внешний круг
  if (dist > r - 1) return [0, 0, 0, 0]

  // Градиент flux сверху-слева вниз-вправо: t от 0 до 1
  const t = Math.max(0, Math.min(1, (x + y) / (w + h)))
  // #FF3D6E (255, 61, 110) → #FF6B3D (255, 107, 61)
  const red = 255
  const green = Math.round(61 + (107 - 61) * t)
  const blue = Math.round(110 + (61 - 110) * t)

  // Внутреннее отверстие знака KINOOX (стилизация буквы «К» / петли)
  const innerDx = x - cx * 0.95
  const innerDy = y - cy * 1.05
  const innerDist = Math.sqrt(innerDx * innerDx + innerDy * innerDy)
  if (innerDist < r * 0.38) {
    return [6, 7, 10, 255] // цвет void (#06070A)
  }

  // Сглаживание края (антиалиасинг)
  const alpha = dist > r - 2 ? Math.round((r - 1 - dist) * 255) : 255
  return [red, green, blue, Math.max(0, Math.min(255, alpha))]
}

async function main() {
  await mkdir(BRAND, { recursive: true })

  // 1. 32×32 PNG → favicon.ico
  const png32 = makePng(32, 32, iconPixel)
  const ico = makeIco(png32, 32, 32)
  await writeFile(join(BRAND, 'favicon.ico'), ico)
  await writeFile(join(PUBLIC, 'favicon.ico'), ico)
  console.log('✓ favicon.ico (32×32, 2 места)')

  // 2. 180×180 PNG → apple-icon.png
  const png180 = makePng(180, 180, iconPixel)
  await writeFile(join(BRAND, 'apple-icon.png'), png180)
  console.log('✓ apple-icon.png (180×180)')

  // 3. 1200×630 PNG → og-image.png (для соцсетей)
  const pngOg = makePng(1200, 630, (x, y, w, h) => {
    // Тёмный фон void (#06070A) с мягким радиальным свечением flux слева
    const t = (x + y) / (w + h)
    const distToGlow = Math.sqrt((x - 200) ** 2 + (y - 315) ** 2)
    const glow = Math.max(0, 1 - distToGlow / 500)
    const r = Math.min(255, Math.round(6 + glow * 120))
    const g = Math.min(255, Math.round(7 + glow * 20))
    const b = Math.min(255, Math.round(10 + glow * 40))
    return [r, g, b, 255]
  })
  await writeFile(join(BRAND, 'og-image.png'), pngOg)
  console.log('✓ og-image.png (1200×630)')
}

main().catch((err) => {
  console.error('Ошибка генерации иконок:', err)
  process.exit(1)
})
