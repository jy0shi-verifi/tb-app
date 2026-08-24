import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { stateMatches } from '../src/lib/strava'

/**
 * The OAuth CSRF defence — a known live risk in CLAUDE.md.
 *
 * Without a `state` parameter, any page on the internet could send the browser
 * to `tb2.joshua-birch.co.uk/?code=…&scope=…` carrying a code of its choosing,
 * and the app would exchange it and store the resulting tokens — silently
 * connecting Josh's app to someone else's Strava account.
 */

const STATE_KEY = 'tb-strava-state'

/**
 * A minimal in-memory `sessionStorage`.
 *
 * Vitest runs this suite in a `node` environment (see vitest.config.ts) and
 * there is no jsdom in the project. Stubbing the two methods `stateMatches`
 * actually touches is lighter, and more honest, than pulling in a DOM just to
 * read one key.
 */
const store = new Map<string, string>()
const fakeSessionStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
}
vi.stubGlobal('sessionStorage', fakeSessionStorage)

beforeEach(() => {
  store.clear()
  vi.stubGlobal('sessionStorage', fakeSessionStorage)
})
afterEach(() => vi.restoreAllMocks())

describe('the OAuth state parameter', () => {
  it('accepts a callback carrying the state we sent', () => {
    sessionStorage.setItem(STATE_KEY, 'abc123')
    expect(stateMatches('abc123')).toBe(true)
  })

  it('REJECTS a callback carrying a different state', () => {
    sessionStorage.setItem(STATE_KEY, 'abc123')
    expect(stateMatches('somebody-elses')).toBe(false)
  })

  it('REJECTS a callback carrying no state at all when we sent one', () => {
    // The exact shape of the attack: a link to /?code=…&scope=… with no state.
    sessionStorage.setItem(STATE_KEY, 'abc123')
    expect(stateMatches(null)).toBe(false)
  })

  it('accepts when we have no stored state — a deliberate trade, not an oversight', () => {
    // A private-mode browser that refused sessionStorage, or a session restored
    // across a restart. Locking the user out of connecting entirely would be
    // worse; this is why the token endpoint ALSO enforces same-origin.
    expect(stateMatches('anything')).toBe(true)
    expect(stateMatches(null)).toBe(true)
  })

  it('accepts when sessionStorage throws outright', () => {
    // Some privacy modes throw on access rather than returning null.
    vi.stubGlobal('sessionStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
    })
    expect(stateMatches('anything')).toBe(true)
  })
})

/**
 * The same-origin check on `POST /api/strava/token`.
 *
 * The function signs whatever `code` it is handed with STRAVA_CLIENT_SECRET, so
 * without a check it is a free token-exchange oracle for our Strava app. The
 * logic is duplicated here rather than imported because `functions/` targets
 * Cloudflare Workers and is compiled by its own tsconfig — see
 * `tsconfig.functions.json`, which is also what caught a dead guard in that file.
 */
function sameOrigin(request: {
  url: string
  headers: { get(name: string): string | null }
}): boolean {
  const site = request.headers.get('sec-fetch-site')
  if (site === 'same-origin') return true
  if (site && site !== 'none') return false
  const origin = request.headers.get('origin')
  if (!origin) return site === 'none'
  try {
    return new URL(origin).origin === new URL(request.url).origin
  } catch {
    return false
  }
}

const req = (headers: Record<string, string>, url = 'https://tb2.joshua-birch.co.uk/api/strava/token') => ({
  url,
  headers: { get: (n: string) => headers[n.toLowerCase()] ?? null },
})

describe('the token endpoint only answers its own pages', () => {
  it('allows a same-origin fetch', () => {
    expect(sameOrigin(req({ 'sec-fetch-site': 'same-origin' }))).toBe(true)
  })

  it('allows a matching Origin when Sec-Fetch-Site is absent (older browsers)', () => {
    expect(sameOrigin(req({ origin: 'https://tb2.joshua-birch.co.uk' }))).toBe(true)
  })

  it('REFUSES another site', () => {
    expect(sameOrigin(req({ 'sec-fetch-site': 'cross-site' }))).toBe(false)
    expect(sameOrigin(req({ origin: 'https://evil.example' }))).toBe(false)
  })

  it('REFUSES a same-site-but-different-subdomain caller', () => {
    expect(sameOrigin(req({ 'sec-fetch-site': 'same-site' }))).toBe(false)
  })

  it('works for every deployment without an allowlist to forget', () => {
    // Derived from the request's own url, so tb, tb2, *.pages.dev previews and
    // localhost are all automatically correct.
    for (const host of [
      'https://tb.joshua-birch.co.uk',
      'https://tb-app-v2.pages.dev',
      'http://localhost:5173',
    ]) {
      expect(sameOrigin(req({ origin: host }, `${host}/api/strava/token`))).toBe(true)
      expect(sameOrigin(req({ origin: 'https://evil.example' }, `${host}/api/strava/token`))).toBe(
        false,
      )
    }
  })

  it('rejects a malformed Origin rather than throwing', () => {
    expect(sameOrigin(req({ origin: 'not a url' }))).toBe(false)
  })
})
