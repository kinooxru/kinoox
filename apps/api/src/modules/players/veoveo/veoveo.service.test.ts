import assert from 'node:assert/strict'
import test from 'node:test'
import { VeoveoService } from './veoveo.service'

const originalFetch = globalThis.fetch

test('findByKinopoiskId searches Webmaster contents and fetches the matching detail', async (context) => {
  const requests: Array<{ url: string; method: string; body?: string }> = []
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input)
    const method = init?.method ?? 'GET'
    requests.push({ url, method, body: typeof init?.body === 'string' ? init.body : undefined })

    if (url === 'https://webmaster.test/v1/contents' && method === 'POST') {
      return new Response(JSON.stringify({ data: [{ id: 42 }], meta: {} }), { status: 200 })
    }
    if (url === 'https://webmaster.test/v1/contents/42') {
      return new Response(JSON.stringify({ id: 42, title: 'Тест', kinopoiskId: 301 }), { status: 200 })
    }
    throw new Error(`Unexpected request: ${method} ${url}`)
  }) as typeof fetch
  context.after(() => {
    globalThis.fetch = originalFetch
  })

  const service = new VeoveoService({ baseUrl: 'https://webmaster.test', token: 'test-token' })
  const content = await service.findByKinopoiskId(301)

  assert.equal(content?.id, 42)
  assert.deepEqual(requests.map(({ url, method }) => `${method} ${url}`), [
    'POST https://webmaster.test/v1/contents',
    'GET https://webmaster.test/v1/contents/42',
  ])
  assert.deepEqual(JSON.parse(requests[0]?.body ?? '{}'), {
    pagination: { page: 1, pageSize: 1, type: 'page' },
    kinopoiskId: [301],
  })
})

test('listContentDetails uses the separate Catalog Sync API base URL', async (context) => {
  let requestedUrl = ''
  globalThis.fetch = (async (input: string | URL | Request) => {
    requestedUrl = String(input)
    return new Response(JSON.stringify({ data: [], meta: {} }), { status: 200 })
  }) as typeof fetch
  context.after(() => {
    globalThis.fetch = originalFetch
  })

  const service = new VeoveoService({
    baseUrl: 'https://webmaster.test',
    catalogSyncBaseUrl: 'https://catalog.test',
    token: 'test-token',
  })
  await service.listContentDetails({ pagination: { page: 1, pageSize: 1, type: 'page' } })

  assert.equal(requestedUrl, 'https://catalog.test/v1/contents/details')
})

test('player URLs use the VeoVeo iframe route, token, supported ID and season parameters', async (context) => {
  let actualizeRequests = 0
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input)
    if (url === 'https://super-puper.che-bur-net.cc/actualize?category=player-entry') {
      actualizeRequests += 1
      return new Response(JSON.stringify({ domain: 'player.example' }), { status: 200 })
    }
    if (url === 'https://webmaster-api.rstprgapipt.com/v1/contents') {
      return new Response(JSON.stringify({ data: [], meta: {} }), { status: 200 })
    }
    throw new Error(`Unexpected request: ${url}`)
  }) as typeof fetch
  context.after(() => {
    globalThis.fetch = originalFetch
  })

  const service = new VeoveoService({ token: 'test token' })
  const source = await service.getPlayerByKpId(301, { season: 2, episode: 3 })

  assert.ok(source)
  const playerUrl = new URL(source.iframeUrl)
  assert.equal(playerUrl.origin, 'https://player.example')
  assert.equal(playerUrl.pathname, '/balancer-api/iframe')
  assert.equal(playerUrl.searchParams.get('kp'), '301')
  assert.equal(playerUrl.searchParams.get('token'), 'test token')
  assert.equal(playerUrl.searchParams.get('disable_checking_available'), '1')
  assert.equal(playerUrl.searchParams.get('season'), '2')
  assert.equal(playerUrl.searchParams.get('episode'), '3')
  assert.equal(actualizeRequests, 1)
  assert.match(source.embedCode ?? '', /<iframe data-player="vv"/)
  assert.match(source.embedCode ?? '', /\/vv2\.js/)
})

test('VeoVeo supports movie_id and IMDB identifier parameters', async (context) => {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ domain: 'player.example' }), { status: 200 })) as typeof fetch
  context.after(() => {
    globalThis.fetch = originalFetch
  })

  const service = new VeoveoService({ token: 'test-token' })
  const byId = await service.getPlayerById('movie 42')
  const byImdb = await service.getPlayerByImdbId('tt0232500')

  assert.equal(new URL(byId?.iframeUrl ?? '').searchParams.get('movie_id'), 'movie 42')
  assert.equal(new URL(byImdb?.iframeUrl ?? '').searchParams.get('imdb'), 'tt0232500')
})
