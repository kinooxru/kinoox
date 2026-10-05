import { TitleGrid } from '@/components/catalog/TitleCard'
import { CatalogFilters, CatalogPagination } from '@/components/catalog/CatalogFilters'
import { api } from '@/lib/api'
import type { FilterOptionsDTO, SortOption, TitleCardDTO, TitleType } from '@kinoox/api-client'

export interface CatalogPageProps {
  searchParams: Record<string, string | string[] | undefined>
  type?: TitleType
  heading: string
  description: string
}

const EMPTY_FILTERS: FilterOptionsDTO = { genres: [], years: [], countries: [] }

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

/**
 * Общий рендер раздела каталога: заголовок, фильтры, сетка, пагинация.
 * Используется страницами /movies, /series, /cartoons, /anime и /catalog.
 */
export async function CatalogPage({ searchParams, type, heading, description }: CatalogPageProps) {
  const page = Math.max(1, Number(firstValue(searchParams.page)) || 1)
  const genre = firstValue(searchParams.genre)
  const yearRaw = firstValue(searchParams.year)
  const sort = (firstValue(searchParams.sort) as SortOption | undefined) ?? 'popular'

  let titles: TitleCardDTO[] = []
  let meta = { page, perPage: 24, total: 0, totalPages: 1 }
  let filters: FilterOptionsDTO = EMPTY_FILTERS

  try {
    const [list, filterOptions] = await Promise.all([
      api.titles.list({
        type,
        genre,
        year: yearRaw ? Number(yearRaw) : undefined,
        sort,
        page,
        perPage: 24,
      }),
      api.titles.filters(),
    ])

    titles = list.items
    meta = list.meta
    filters = filterOptions
  } catch {
    // API недоступен — показываем пустое состояние, страница не падает
  }

  return (
    <div className="kx-container py-12">
      <header className="mb-10">
        <h1 className="font-display text-[var(--text-h1)] font-bold tracking-[-0.02em] text-text-primary">
          {heading}
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--text-body)] text-text-secondary">{description}</p>
      </header>

      <CatalogFilters fixedType={type} options={filters} total={meta.total} />

      <div className="mt-10">
        {titles.length > 0 ? (
          <TitleGrid titles={titles} />
        ) : (
          <div className="rounded-[20px] border border-frost bg-abyss px-6 py-16 text-center">
            <p className="font-display text-[var(--text-h3)] font-semibold text-text-primary">
              Ничего не найдено
            </p>
            <p className="mx-auto mt-3 max-w-md text-[var(--text-small)] text-text-secondary">
              Попробуйте изменить фильтры или загляните позже — каталог пополняется каждый день.
            </p>
          </div>
        )}
      </div>

      <CatalogPagination page={meta.page} totalPages={meta.totalPages} />
    </div>
  )
}