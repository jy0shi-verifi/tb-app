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

/** Kick off the OAuth flow — sends the browser to Strava to authorise. */
export function beginStravaAuth(): void {
  const url = new URL('https://www.strava.com/oauth/authorize')
  url.searchParams.set('client_id', STRAVA_CLIENT_ID)
  url.searchParams.set('redirect_uri', `${window.location.origin}/`)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', SCOPE)
  url.searchParams.set('approval_prompt', 'auto')
  window.location.assign(url.toString())
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
    await storeTokens(await tokenExchange({ code }), scope)
    return true
  } finally {
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
 * Rename an activity on Strava (needs activity:write). Routed through our Pages
 * Function (Strava's API has no browser CORS). Returns false if the token lacks
 * write scope (401/403) so callers can prompt a reconnect; throws on real errors.
 */
export async function updateStravaActivityName(
  accessToken: string,
  activityId: number,
  name: string,
): Promise<boolean> {
  const r = await fetch('/api/strava/update', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ accessToken, activityId, name }),
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
