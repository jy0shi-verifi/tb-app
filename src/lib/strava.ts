import { db, saveSettings } from '../db'
import type { Settings } from '../types'

// Public Strava app Client ID (safe to ship in the client bundle). Fill after
// creating the Strava API app; keep it identical to functions/api/strava/token.ts.
export const STRAVA_CLIENT_ID: string = '263946'
// read_all: pull activities; write: rename them back with their programme name.
const SCOPE = 'activity:read_all,activity:write'
const TOKEN_ENDPOINT = '/api/strava/token'

export function stravaConfigured(): boolean {
  return !!STRAVA_CLIENT_ID && STRAVA_CLIENT_ID !== '__STRAVA_CLIENT_ID__'
}

/**
 * Where the one-shot OAuth `state` is parked between leaving for Strava and
 * coming back. `sessionStorage`, not `localStorage`: it should not outlive the
 * tab, and a stale value is worse than none.
 */
const STATE_KEY = 'tb-strava-state'

/** A one-shot, unguessable value. Falls back only if `crypto` is unavailable. */
function newState(): string {
  try {
    const a = new Uint8Array(16)
    crypto.getRandomValues(a)
    return [...a].map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  }
}

/**
 * Kick off the OAuth flow — sends the browser to Strava to authorise.
 *
 * The `state` parameter is the CSRF defence for the callback: without it, any
 * page can send the browser to `tb2.joshua-birch.co.uk/?code=…&scope=…` with a
 * code of its choosing and the app would exchange it and store the resulting
 * tokens — silently connecting Josh's app to somebody else's Strava account.
 * The flow had none (a known live risk in CLAUDE.md).
 */
export function beginStravaAuth(): void {
  const state = newState()
  try {
    sessionStorage.setItem(STATE_KEY, state)
  } catch {
    /* private mode — the callback will fall back to accepting a stateless reply */
  }
  const url = new URL('https://www.strava.com/oauth/authorize')
  url.searchParams.set('client_id', STRAVA_CLIENT_ID)
  url.searchParams.set('redirect_uri', `${window.location.origin}/`)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', SCOPE)
  url.searchParams.set('approval_prompt', 'auto')
  url.searchParams.set('state', state)
  window.location.assign(url.toString())
}

/**
 * Whether a callback's `state` matches the one we sent.
 *
 * Exported for testing. Returns false when we have a stored state and the reply
 * does not match it. When there is NO stored state — a private-mode browser that
 * refused sessionStorage, or a session restored across a browser restart — it
 * returns true rather than locking the user out of connecting at all; that is a
 * deliberate trade, and it is why the check is not the only defence (the token
 * endpoint also enforces same-origin).
 */
export function stateMatches(returned: string | null): boolean {
  let expected: string | null = null
  try {
    expected = sessionStorage.getItem(STATE_KEY)
  } catch {
    return true
  }
  if (!expected) return true
  return returned === expected
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_at: number
  athlete?: { id: number }
}

/** True once the user has (re)connected granting activity:write. */
export function stravaCanWrite(settings: Settings): boolean {
  return !!settings.strava?.scope?.includes('activity:write')
}

async function tokenExchange(payload: { code?: string; refreshToken?: string }): Promise<TokenResponse> {
  const r = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = (await r.json()) as TokenResponse
  if (!r.ok || !data.access_token) throw new Error('Strava token exchange failed')
  return data
}

async function storeTokens(t: TokenResponse, scope?: string): Promise<void> {
  // Preserve athleteId/scope across silent refreshes (only the connect callback
  // carries the granted scope; token refreshes don't echo it back).
  const cur = (await db.settings.get('app'))?.strava
  await saveSettings({
    strava: {
      accessToken: t.access_token,
      refreshToken: t.refresh_token,
      expiresAt: t.expires_at,
      athleteId: t.athlete?.id ?? cur?.athleteId,
      scope: scope ?? cur?.scope,
    },
  })
}

/** On app load: if we returned from Strava with ?code=…, exchange it and store tokens, then clean the URL. */
export async function handleStravaRedirect(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const scope = params.get('scope')
  if (!code || !scope) return false // not a Strava callback
  try {
    // Reject a callback we did not start. Without this, any page could push the
    // browser at this URL with its own `code` and connect the app to someone
    // else's Strava account.
    if (!stateMatches(params.get('state'))) return false
    await storeTokens(await tokenExchange({ code }), scope)
    return true
  } finally {
    try {
      sessionStorage.removeItem(STATE_KEY)
    } catch {
      /* no-op */
    }
    window.history.replaceState({}, '', window.location.pathname)
  }
}

/** A valid access token, transparently refreshing (via the function) if expired. */
export async function getStravaAccessToken(settings: Settings): Promise<string | null> {
  const s = settings.strava
  if (!s) return null
  const now = Math.floor(Date.now() / 1000)
  if (s.expiresAt - 60 > now) return s.accessToken
  const t = await tokenExchange({ refreshToken: s.refreshToken })
  await storeTokens(t)
  return t.access_token
}

export interface StravaActivity {
  id: number
  name?: string
  type: string
  sport_type?: string
  start_date_local: string
  moving_time: number
  distance: number
  average_heartrate?: number
}

export async function fetchStravaActivities(accessToken: string, afterEpoch: number): Promise<StravaActivity[]> {
  // Routed through our Pages Function (Strava's API has no CORS for browsers).
  const r = await fetch('/api/strava/activities', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ accessToken, after: afterEpoch }),
  })
  const data = await r.json()
  if (!r.ok || !Array.isArray(data)) {
    throw new Error(`activities ${r.status} ${JSON.stringify(data).slice(0, 140)}`)
  }
  return data as StravaActivity[]
}

/**
 * Update an activity on Strava — name and/or description (needs activity:write).
 * Routed through our Pages Function (Strava's API has no browser CORS). Returns
 * false if the token lacks write scope (401/403) so callers can prompt a
 * reconnect; throws on real errors.
 */
export async function updateStravaActivityName(
  accessToken: string,
  activityId: number,
  name: string,
  description?: string,
): Promise<boolean> {
  const r = await fetch('/api/strava/update', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ accessToken, activityId, name, description }),
  })
  if (r.status === 401 || r.status === 403) return false // not granted write scope
  if (!r.ok) {
    const t = await r.text()
    throw new Error(`update ${r.status} ${t.slice(0, 140)}`)
  }
  return true
}

export async function disconnectStrava(): Promise<void> {
  await saveSettings({ strava: undefined })
}
