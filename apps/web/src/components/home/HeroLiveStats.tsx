'use client'

import React, { useEffect, useState } from 'react'
import type { SystemStatsDTO } from '@kinoox/api-client'
import { api } from '@/lib/api'

export interface HeroLiveStatsProps {
  initialStats?: SystemStatsDTO | null
}

function formatStatNumber(num: number): string {
  if (!num || num <= 0) return '0'
  if (num < 1000) return String(num)
  return `${num.toLocaleString('ru-RU')}+`
}

function formatRating(rating: number): string {
  if (!rating || rating <= 0) return '0.0★'
  return `${rating.toFixed(1)}★`
}

/**
 * Блок живой статистики KINOOX:
 * - Отображает реальные данные с нуля из базы данных
 * - Автоматически обновляется в реальном времени каждые 20 секунд
 */
export function HeroLiveStats({ initialStats }: HeroLiveStatsProps) {
  const [stats, setStats] = useState<SystemStatsDTO>(
    initialStats ?? {
      titlesCount: 0,
      usersCount: 0,
      averageRating: 0,
      downloadsCount: 0,
    },
  )

  useEffect(() => {
    let mounted = true

    async function fetchStats() {
      try {
        const fresh = await api.system.stats()
        if (mounted && fresh) {
          setStats(fresh)
        }
      } catch {
        // При сетевой ошибке сохраняем последние валидные значения
      }
    }

    // Всегда запрашиваем актуальные данные из API при монтировании в браузере
    fetchStats()

    // Периодическое обновление в реальном времени
    const interval = setInterval(fetchStats, 20_000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [initialStats])

  const items = [
    { label: 'тайтлов', value: formatStatNumber(stats.titlesCount) },
    { label: 'пользователей', value: formatStatNumber(stats.usersCount) },
    { label: 'рейтинг', value: formatRating(stats.averageRating) },
    { label: 'загрузок', value: formatStatNumber(stats.downloadsCount) },
  ]

  return (
    <dl className="mt-14 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
      {items.map((stat) => (
        <div key={stat.label}>
          <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
            {stat.label}
          </dt>
          <dd className="mt-1 font-display text-[var(--text-h2)] font-semibold text-text-primary transition-all duration-500">
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
