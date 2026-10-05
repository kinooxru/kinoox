/**
 * KINOOX Desktop — точка входа интерфейса.
 *
 * Инициализирует кастомный заголовок окна, горячие клавиши,
 * системный трей и каталог тайтлов.
 */

import type { TitleCardDTO } from '@kinoox/api-client'
import { api } from './lib/api'
import { desktop, type ContinueWatching } from './lib/tauri'

const TITLE_TYPE_LABELS: Record<string, string> = {
  movie: 'Фильм',
  serial: 'Сериал',
  cartoon: 'Мультфильм',
  anime: 'Аниме',
}

const app = document.getElementById('app')!

app.innerHTML = `
  <header class="titlebar" data-tauri-drag-region>
    <span class="titlebar__brand">
      <span class="titlebar__logo"></span>
      KINOOX
    </span>
    <div class="titlebar__actions">
      <button class="titlebar__button" data-window="minimize" title="Свернуть">—</button>
      <button class="titlebar__button" data-window="maximize" title="Развернуть">▢</button>
      <button class="titlebar__button titlebar__button--close" data-window="close" title="Скрыть в трей">✕</button>
    </div>
  </header>

  <main class="app">
    <div class="app__body">
      <div class="app__header">
        <h1 class="app__title">Каталог</h1>
        <label class="search">
          <span aria-hidden="true">⌕</span>
          <input id="search-input" type="search" placeholder="Поиск по каталогу" />
          <span class="kbd">Ctrl F</span>
        </label>
        <button class="button button--glass" id="mini-button">Мини-плеер</button>
      </div>

      <section class="section" id="continue-section" hidden>
        <div class="section__head">
          <h2 class="section__title">Продолжить просмотр</h2>
        </div>
        <div id="continue-content"></div>
      </section>

      <section class="section">
        <div class="section__head">
          <h2 class="section__title">В тренде</h2>
          <span class="section__hint" id="status-hint">Загрузка…</span>
        </div>
        <div class="grid" id="catalog-grid"></div>
      </section>
    </div>
  </main>
`

const grid = document.getElementById('catalog-grid')!
const statusHint = document.getElementById('status-hint')!
const searchInput = document.getElementById('search-input') as HTMLInputElement
const continueSection = document.getElementById('continue-section')!
const continueContent = document.getElementById('continue-content')!

/** Карточка тайтла в стиле дизайн-системы */
function renderCard(title: TitleCardDTO): string {
  const high = typeof title.ratingKp === 'number' && title.ratingKp > 7
  const rating =
    typeof title.ratingKp === 'number' && title.ratingKp > 0 ? title.ratingKp.toFixed(1) : '—'

  return `
    <article class="card" data-title-id="${title.id}" tabindex="0">
      <img class="card__poster" src="${title.posterUrl}" alt="${escapeHtml(title.title)}" loading="lazy" />
      <div class="card__veil"></div>
      <div class="card__rating ${high ? 'card__rating--high' : 'card__rating--low'}">${rating}</div>
      <div class="card__info">
        <h3 class="card__name">${escapeHtml(title.title)}</h3>
        <p class="card__meta">${title.year} · ${TITLE_TYPE_LABELS[title.type] ?? 'Тайтл'}</p>
      </div>
    </article>
  `
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Кнопки кастомного заголовка */
document.querySelectorAll<HTMLButtonElement>('[data-window]').forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.dataset.window as 'minimize' | 'maximize' | 'close'
    void desktop.windowControl(action)
  })
})

/** Кнопка мини-плеера */
document.getElementById('mini-button')?.addEventListener('click', () => {
  void desktop.toggleMiniPlayer(true)
})

/** Загрузка каталога */
async function loadCatalog(query = ''): Promise<void> {
  statusHint.textContent = 'Загрузка…'
  grid.innerHTML = Array.from({ length: 12 }, () => '<div class="skeleton" style="aspect-ratio:2/3"></div>').join('')

  try {
    const result = query.trim()
      ? await api.search.search({ q: query.trim(), perPage: 60 })
      : await api.titles.list({ sort: 'popular', page: 1, perPage: 60 })

    if (result.items.length === 0) {
      grid.innerHTML = '<div class="empty">Ничего не найдено</div>'
      statusHint.textContent = '0 тайтлов'
      return
    }

    grid.innerHTML = result.items.map(renderCard).join('')
    statusHint.textContent = `${result.meta?.total ?? result.items.length} тайтлов`

    grid.querySelectorAll<HTMLElement>('.card').forEach((card) => {
      const open = () => {
        const id = Number(card.dataset.titleId)
        if (Number.isFinite(id)) void openTitle(id)
      }
      card.addEventListener('click', open)
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          open()
        }
      })
    })
  } catch {
    grid.innerHTML =
      '<div class="empty">Не удалось загрузить каталог. Проверьте подключение к интернету.</div>'
    statusHint.textContent = 'Ошибка загрузки'
  }
}

/** Открытие тайтла: запоминаем его для трея и уведомляем Rust-часть */
async function openTitle(titleId: number): Promise<void> {
  try {
    const title = await api.titles.byId(titleId)
    const item: ContinueWatching = {
      titleId: title.id,
      titleName: title.title,
      season: null,
      episode: null,
    }
    await desktop.setContinueWatching(item).catch(() => undefined)

    // Записываем прогресс просмотра в аккаунт пользователя
    await api.user.addHistory({ titleId: title.id }).catch(() => undefined)

    // Открываем страницу просмотра на сайте в системном браузере
    window.open(`https://kinoox.ru/title/${title.id}/watch`, '_blank')
  } catch {
    // Тайтл может быть недоступен офлайн
  }
}

/** Показ записи «Продолжить просмотр» */
async function renderContinueWatching(): Promise<void> {
  const item = await desktop.getContinueWatching().catch(() => null)
  if (!item) {
    continueSection.hidden = true
    return
  }

  continueSection.hidden = false
  continueContent.innerHTML = `
    <button class="button button--flux" id="continue-button">
      Продолжить «${escapeHtml(item.titleName)}»
    </button>
  `
  document.getElementById('continue-button')?.addEventListener('click', () => {
    void openTitle(item.titleId)
  })
}

/** Горячие клавиши: Ctrl+F — поиск, Ctrl+D — закладка, Space — пауза, Esc — выход из плеера */
window.addEventListener('keydown', (event) => {
  const target = event.target as HTMLElement | null
  const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA'

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
    event.preventDefault()
    searchInput.focus()
    searchInput.select()
    return
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
    event.preventDefault()
    // Закладка добавляется для тайтла, выбранного в каталоге
    const selected = document.querySelector<HTMLElement>('.card:focus, .card:hover')
    const id = selected ? Number(selected.dataset.titleId) : NaN
    if (Number.isFinite(id)) {
      void api.user.addBookmark({ titleId: id, status: 'watching' }).catch(() => undefined)
    }
    return
  }

  if (event.key === ' ') {
    event.preventDefault()
    document.dispatchEvent(new CustomEvent('kinoox:toggle-playback'))
    return
  }

  if (event.key === 'Escape' && !typing) {
    document.dispatchEvent(new CustomEvent('kinoox:exit-player'))
  }
})

// Поиск с задержкой 250 мс
let searchTimer: ReturnType<typeof setTimeout> | null = null
searchInput.addEventListener('input', () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    void loadCatalog(searchInput.value)
  }, 250)
})

/** События из системного трея */
void desktop.onTrayEvent('tray:search', () => {
  searchInput.focus()
})
void desktop.onTrayEvent('tray:continue', () => {
  void renderContinueWatching()
})
void desktop.onTrayEvent('tray:mini-player', () => {
  void desktop.toggleMiniPlayer(true)
})
void desktop.onTrayEvent('tray:bookmark', () => {
  const selected = document.querySelector<HTMLElement>('.card:focus, .card:hover')
  const id = selected ? Number(selected.dataset.titleId) : NaN
  if (Number.isFinite(id)) {
    void api.user.addBookmark({ titleId: id, status: 'watching' }).catch(() => undefined)
  }
})

// Первичная загрузка
void loadCatalog()
void renderContinueWatching()
