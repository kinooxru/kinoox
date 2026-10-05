import assert from 'node:assert/strict'
import test from 'node:test'
import { CatalogSyncService } from './catalog.sync.service'
import type { PrismaClient } from '@prisma/client'

test('selectBestPoster chooses remote URL over local svg placeholders', () => {
  const sync = new CatalogSyncService({} as PrismaClient)
  // @ts-expect-error accessing private method for unit test
  const best = sync.selectBestPoster(['/posters/1.svg', 'https://cdn.example.com/poster.jpg', null])
  assert.equal(best, 'https://cdn.example.com/poster.jpg')
})

test('resolveTitleType correctly categorizes anime, cartoons, serials and movies', () => {
  const sync = new CatalogSyncService({} as PrismaClient)

  // Аниме
  const animeType = sync.resolveTitleType({
    genres: ['аниме', 'боевик'],
    countries: ['Япония'],
    isSerial: true,
  })
  assert.equal(animeType, 'anime')

  // Мультфильм
  const cartoonType = sync.resolveTitleType({
    genres: ['мультфильм', 'комедия'],
    countries: ['США'],
    isSerial: false,
  })
  assert.equal(cartoonType, 'cartoon')

  // Сериал
  const serialType = sync.resolveTitleType({
    genres: ['драма'],
    countries: ['США'],
    isSerial: true,
  })
  assert.equal(serialType, 'serial')

  // Фильм
  const movieType = sync.resolveTitleType({
    genres: ['триллер'],
    countries: ['Франция'],
    isSerial: false,
  })
  assert.equal(movieType, 'movie')
})

test('resolveTitleStatus correctly marks completed serials vs ongoing', () => {
  const sync = new CatalogSyncService({} as PrismaClient)

  // 1. Фильм всегда released
  assert.equal(
    sync.resolveTitleStatus({
      type: 'movie',
      year: 2024,
      hasEpisodes: false,
    }),
    'released',
  )

  // 2. Сериал с endYear в прошлом — released (например Игра Престолов, 2011–2019)
  assert.equal(
    sync.resolveTitleStatus({
      type: 'serial',
      year: 2011,
      endYear: 2019,
      hasEpisodes: true,
    }),
    'released',
  )

  // 3. Сериал, у которого в БД уже был статус released, не сбрасывается в ongoing
  assert.equal(
    sync.resolveTitleStatus({
      existingStatus: 'released',
      type: 'serial',
      year: 2011,
      hasEpisodes: true,
    }),
    'released',
  )

  // 4. Старый сериал/аниме без endYear (вышел несколько лет назад) — released
  assert.equal(
    sync.resolveTitleStatus({
      type: 'anime',
      year: 2013,
      hasEpisodes: true,
    }),
    'released',
  )

  // 5. Свежий сериал текущего года с сериями — ongoing
  const currentYear = new Date().getFullYear()
  assert.equal(
    sync.resolveTitleStatus({
      type: 'serial',
      year: currentYear,
      hasEpisodes: true,
    }),
    'ongoing',
  )
})


