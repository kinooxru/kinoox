/**
 * Генератор QR-кодов стандарта ISO/IEC 18004 (версии 1..10, коррекция ошибок M).
 * Чистая реализация на TypeScript без внешних зависимостей.
 *
 * Возвращает булеву матрицу (true = чёрный модуль, false = белый)
 * либо готовый SVG-код.
 */

// Кодовые слова коррекции ошибок для уровня M (15% восстановления)
// Формат: [всего_слов, слов_данных_M, ec_слов_M]
const VERSION_CAPACITY = [
  null,
  [26, 16, 10],   // v1:  16 данных, 10 EC
  [44, 28, 16],   // v2:  28 данных, 16 EC
  [70, 44, 26],   // v3:  44 данных, 26 EC
  [100, 64, 36],  // v4:  64 данных, 36 EC
  [134, 86, 48],  // v5:  86 данных, 48 EC
  [172, 108, 64], // v6: 108 данных, 64 EC
  [196, 124, 72], // v7: 124 данных, 72 EC
  [242, 154, 88], // v8: 154 данных, 88 EC
] as const

// Поле Галуа GF(2^8) с примитивным полиномом 0x11d
const EXP_TABLE = new Uint8Array(512)
const LOG_TABLE = new Uint8Array(256)
let x = 1
for (let i = 0; i < 255; i++) {
  EXP_TABLE[i] = x
  EXP_TABLE[i + 255] = x
  LOG_TABLE[x] = i
  x = (x << 1) ^ (x >= 128 ? 0x11d : 0)
}

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  return EXP_TABLE[LOG_TABLE[a]! + LOG_TABLE[b]!]!
}

// Генератор полинома для Reed-Solomon
function rsGenPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1])
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1)
    const factor = EXP_TABLE[i]!
    for (let j = 0; j < poly.length; j++) {
      const cur = next[j] ?? 0
      const nextVal = next[j + 1] ?? 0
      next[j] = cur ^ gfMul(poly[j]!, factor)
      next[j + 1] = nextVal ^ poly[j]!
    }
    poly = next
  }
  return poly
}

function rsEncode(data: Uint8Array, ecLength: number): Uint8Array {
  const gen = rsGenPoly(ecLength)
  const remainder = new Uint8Array(ecLength)

  for (let i = 0; i < data.length; i++) {
    const factor = data[i]! ^ remainder[0]!
    for (let j = 0; j < ecLength - 1; j++) {
      remainder[j] = remainder[j + 1]! ^ gfMul(gen[j]!, factor)
    }
    remainder[ecLength - 1] = gfMul(gen[ecLength - 1]!, factor)
  }

  return remainder
}

// Позиции маркеров выравнивания (alignment patterns) по версиям
const ALIGNMENT_PATTERN_POS = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
] as const

/**
 * Кодирует байтовую строку в матрицу QR-кода.
 */
export function generateQrMatrix(text: string): boolean[][] {
  const utf8 = new TextEncoder().encode(text)

  // Выбираем минимальную версию (1..8)
  let version = 1
  while (version <= 8) {
    const cap = VERSION_CAPACITY[version]![1]
    // 4 бита режима (byte = 0100) + 8/16 бит длины + данные + 4 бита терминатора
    const countBits = version < 10 ? 8 : 16
    const neededBytes = Math.ceil((4 + countBits + utf8.length * 8 + 4) / 8)
    if (neededBytes <= cap) break
    version++
  }
  if (version > 8) version = 8 // обрезаем/переполняем для предсказуемости

  const cap = VERSION_CAPACITY[version]![1]
  const ecLen = VERSION_CAPACITY[version]![2]
  const countBits = version < 10 ? 8 : 16

  // Формируем поток битов
  const bits: number[] = []
  function pushBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1)
  }

  // Режим byte (0100)
  pushBits(0b0100, 4)
  // Длина
  pushBits(utf8.length, countBits)
  // Байты данных
  for (const b of utf8) pushBits(b, 8)
  // Терминатор
  pushBits(0, Math.min(4, cap * 8 - bits.length))
  // Выравнивание до байта
  while (bits.length % 8 !== 0) bits.push(0)
  // Pad-байты 0xEC и 0x11
  const pad = [0xec, 0x11]
  let padIdx = 0
  while (bits.length < cap * 8) {
    pushBits(pad[padIdx % 2]!, 8)
    padIdx++
  }

  // Конвертируем биты в байты
  const dataBytes = new Uint8Array(cap)
  for (let i = 0; i < cap; i++) {
    let b = 0
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i * 8 + j]!
    dataBytes[i] = b
  }

  // Вычисляем коррекцию ошибок
  const ecBytes = rsEncode(dataBytes, ecLen)

  // Полный массив кодовых слов: данные + EC
  const allCodewords = new Uint8Array(cap + ecLen)
  allCodewords.set(dataBytes, 0)
  allCodewords.set(ecBytes, cap)

  // Размер матрицы
  const size = version * 4 + 17
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null),
  )

  // 1. Поисковые узоры (finder patterns) 7×7 на трёх углах
  function placeFinder(r: number, c: number) {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const row = r + dr
        const col = c + dc
        if (row < 0 || row >= size || col < 0 || col >= size) continue
        if (dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6) {
          const isBlack =
            dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4)
          matrix[row]![col] = isBlack
        } else {
          // Разделитель
          matrix[row]![col] = false
        }
      }
    }
  }

  placeFinder(0, 0)
  placeFinder(0, size - 7)
  placeFinder(size - 7, 0)

  // 2. Узоры выравнивания (alignment patterns) 5×5
  const alignPos = ALIGNMENT_PATTERN_POS[version] ?? []
  for (const ar of alignPos) {
    for (const ac of alignPos) {
      if (matrix[ar]![ac] !== null) continue // не перекрываем finder
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const isBlack = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0)
          matrix[ar + dr]![ac + dc] = isBlack
        }
      }
    }
  }

  // 3. Синхронизирующие полосы (timing patterns)
  for (let i = 8; i < size - 8; i++) {
    if (matrix[6]![i] === null) matrix[6]![i] = i % 2 === 0
    if (matrix[i]![6] === null) matrix[i]![6] = i % 2 === 0
  }

  // 4. Тёмный модуль
  matrix[size - 8]![8] = true

  // 5. Зарезервированные области формата (будут заполнены позже)
  for (let i = 0; i < 9; i++) {
    if (matrix[8]![i] === null) matrix[8]![i] = false
    if (matrix[i]![8] === null) matrix[i]![8] = false
  }
  for (let i = 0; i < 8; i++) {
    if (matrix[8]![size - 1 - i] === null) matrix[8]![size - 1 - i] = false
    if (matrix[size - 1 - i]![8] === null) matrix[size - 1 - i]![8] = false
  }

  // 6. Размещение данных (зигзаг справа налево по 2 колонки)
  let bitIdx = 0
  const totalBits = allCodewords.length * 8
  let up = true

  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right-- // пропускаем вертикальную полосу timing
    const left = right - 1

    for (let v = 0; v < size; v++) {
      const row = up ? size - 1 - v : v
      for (const col of [right, left]) {
        if (matrix[row]![col] !== null) continue // занято функцией
        let bit = false
        if (bitIdx < totalBits) {
          const byteVal = allCodewords[Math.floor(bitIdx / 8)]!
          bit = ((byteVal >> (7 - (bitIdx % 8))) & 1) === 1
          bitIdx++
        }
        // Маска 0: (row + col) % 2 === 0
        const mask = (row + col) % 2 === 0
        matrix[row]![col] = bit !== mask
      }
    }
    up = !up
  }

  // 7. Информация о формате: уровень M (00) + маска 0 (000) = 00000
  // После BCH(15,5) и маскирования 101010000010010:
  // Для уровня M и маски 0 предопределённая строка бит: 101010000010010
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0]

  // Вокруг левого верхнего finder
  const formatCoordsTopLeft = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ] as const
  for (let i = 0; i < 15; i++) {
    const [r, c] = formatCoordsTopLeft[i]!
    matrix[r]![c] = formatBits[i] === 1
  }

  // Разделённый формат (правый верх + левый низ)
  for (let i = 0; i < 7; i++) {
    matrix[8]![size - 1 - i] = formatBits[i] === 1
  }
  for (let i = 0; i < 8; i++) {
    matrix[size - 8 + i]![8] = formatBits[7 + i] === 1
  }

  return matrix.map((row) => row.map((cell) => cell ?? false))
}

/**
 * Генерирует векторный SVG QR-кода.
 */
export function generateQrSvg(
  text: string,
  options: {
    size?: number
    darkColor?: string
    lightColor?: string
    margin?: number
  } = {},
): string {
  const {
    size = 200,
    darkColor = '#06070A',
    lightColor = '#FFFFFF',
    margin = 2,
  } = options

  const matrix = generateQrMatrix(text)
  const moduleCount = matrix.length
  const totalCount = moduleCount + margin * 2

  let paths = ''
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (matrix[r]![c]) {
        const x = c + margin
        const y = r + margin
        paths += `M${x},${y}h1v1h-1z `
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalCount} ${totalCount}" width="${size}" height="${size}" shape-rendering="crispEdges" role="img" aria-label="QR-код">
  <rect width="${totalCount}" height="${totalCount}" fill="${lightColor}" />
  <path d="${paths.trim()}" fill="${darkColor}" />
</svg>`
}
