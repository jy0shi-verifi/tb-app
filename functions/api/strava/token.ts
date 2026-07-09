// Cloudflare Pages Function — POST /api/strava/token
// Exchanges a Strava OAuth `code` (first connect) or a `refreshToken` (renewal)
// for access tokens SERVER-SIDE, so the client secret never reaches the browser.
// Runs on the same origin as the app (no CORS).
//
// Config:
//   STRAVA_CLIENT_ID     — public Strava app Client ID (filled in below)
//   STRAVA_CLIENT_SECRET — Pages secret: `wrangler pages secret put STRAVA_CLIENT_SECRET`

const STRAVA_CLIENT_ID = '263946' // Strava app Client ID (public)

interface Env {
  STRAVA_CLIENT_SECRET: string
}

export async function onRequestPost(context: {
  request: Request
  env: Env
}): Promise<Response> {
  const { request, env } = context
  if (!env.STRAVA_CLIENT_SECRET || STRAVA_CLIENT_ID === '__STRAVA_CLIENT_ID__') {
    return json({ error: 'strava not configured on server' }, 500)
  }

  let body: { code?: string; refreshToken?: string }
  try {
    body = await request.json()
  } catch {
    return json({ error: 'invalid body' }, 400)
  }

  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    client_secret: env.STRAVA_CLIENT_SECRET,
  })
  if (body.code) {
    params.set('code', body.code)
    params.set('grant_type', 'authorization_code')
  } else if (body.refreshToken) {
    params.set('refresh_token', body.refreshToken)
    params.set('grant_type', 'refresh_token')
  } else {
    return json({ error: 'missing code or refreshToken' }, 400)
  }

  const res = await fetch('https://www.strava.com/oauth/token', { method: 'POST', body: params })
  const data = await res.json()
  return json(data, res.status)
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
