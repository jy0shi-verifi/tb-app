import { saveSettings } from '../db'
import type { Settings } from '../types'

// Public Strava app Client ID (safe to ship in the client bundle). Fill after
// creating the Strava API app; keep it identical to functions/api/strava/token.ts.
export const STRAVA_CLIENT_ID: string = '263946'
const SCOPE = 'activity:read_all'
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

async function storeTokens(t: TokenResponse): Promise<void> {
  await saveSettings({
    strava: {
      accessToken: t.access_token,
      refreshToken: t.refresh_token,
      expiresAt: t.expires_at,
      athleteId: t.athlete?.id,
    },
  })
}

/** On app load: if we returned from Strava with ?code=…, exchange it and store tokens, then clean the URL. */
export async function handleStravaRedirect(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  if (!code || !params.get('scope')) return false // not a Strava callback
  try {
    await storeTokens(await tokenExchange({ code }))
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
  type: string
  sport_type?: string
  start_date_local: string
  moving_time: number
  distance: number
  average_heartrate?: number
}

export async function fetchStravaActivities(accessToken: string, afterEpoch: number): Promise<StravaActivity[]> {
  const url = new URL('https://www.strava.com/api/v3/athlete/activities')
  url.searchParams.set('after', String(afterEpoch))
  url.searchParams.set('per_page', '100')
  const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!r.ok) throw new Error('Strava activities fetch failed')
  return (await r.json()) as StravaActivity[]
}

export async function disconnectStrava(): Promise<void> {
  await saveSettings({ strava: undefined })
}
