/**
 * Мини-плеер KINOOX — отдельное окно, всегда поверх остальных.
 * Открывается из трея или кнопкой «Мини-плеер».
 */
import { desktop } from './lib/tauri'

const root = document.getElementById('mini-player')!

root.innerHTML = `
  <div class="mini">
    <iframe
      class="mini__video"
      id="mini-frame"
      src="about:blank"
      title="Мини-плеер KINOOX"
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
      allowfullscreen
    ></iframe>

    <div class="mini__progress">
      <div class="mini__progress-fill" id="mini-progress" style="width:0%"></div>
    </div>

    <div class="mini__bar">
      <span class="mini__name" id="mini-name">KINOOX</span>
      <button class="mini__button" id="mini-play" title="Пауза / воспроизведение">▶</button>
      <button class="mini__button" id="mini-expand" title="Вернуть окно">⤢</button>
      <button class="mini__button" id="mini-close" title="Закрыть мини-плеер">✕</button>
    </div>
  </div>
`

const frame = document.getElementById('mini-frame') as HTMLIFrameElement
const name = document.getElementById('mini-name')!
const progress = document.getElementById('mini-progress')!

/** Восстановить обычное окно */
document.getElementById('mini-expand')?.addEventListener('click', () => {
  void desktop.toggleMiniPlayer(false)
})

/** Закрыть мини-плеер и вернуть основное окно */
document.getElementById('mini-close')?.addEventListener('click', () => {
  void desktop.toggleMiniPlayer(false)
})

/** Пауза/воспроизведение: команда передаётся в iframe через postMessage */
document.getElementById('mini-play')?.addEventListener('click', () => {
  frame.contentWindow?.postMessage({ type: 'playerCommand', command: 'toggle' }, '*')
})

// Следим за изменением режима мини-плеера
void desktop.onMiniPlayerChanged((state) => {
  if (!state.active) {
    // Возврат в основное окно — очищаем источник
    frame.src = 'about:blank'
    progress.style.width = '0%'
    name.textContent = 'KINOOX'
  }
})

// Прогресс воспроизведения приходит из плеера через postMessage
window.addEventListener('message', (event) => {
  const data = event.data as { type?: string; time?: number; duration?: number; title?: string }

  if (data?.type === 'playerEvent' && typeof data.time === 'number' && typeof data.duration === 'number') {
    const percent = data.duration > 0 ? (data.time / data.duration) * 100 : 0
    progress.style.width = `${Math.min(100, percent)}%`
  }

  if (typeof data?.title === 'string') {
    name.textContent = data.title
  }
})

/** Открыть конкретный источник в мини-плеере */
export function openInMiniPlayer(url: string, title: string): void {
  frame.src = url
  name.textContent = title
}
