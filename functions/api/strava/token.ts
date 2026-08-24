// Cloudflare Pages Function — POST /api/strava/token
// Exchanges a Strava OAuth `code` (first connect) or a `refreshToken` (renewal)
// for access tokens SERVER-SIDE, so the client secret never reaches the browser.
// Runs on the same origin as the app (no CORS).
//
// Config:
//   STRAVA_CLIENT_ID     — public Strava app Client ID (filled in below)
//   STRAVA_CLIENT_SECRET — Pages secret: `wrangler pages secret put STRAVA_CLIENT_SECRET`

// Typed as `string`, not inferred as the literal, so the "not configured yet"
// guard below is a real check rather than a comparison TypeScript can prove
// false. `src/lib/strava.ts` types its copy the same way, and adding
// `tsconfig.functions.json` is what surfaced the difference.
const STRAVA_CLIENT_ID: string = '263946' // Strava app Client ID (public)

interface Env {
  STRAVA_CLIENT_SECRET: string
}

/**
 * Refuse a request that did not come from this app's own pages.
 *
 * This endpoint signs whatever `code` it is handed with STRAVA_CLIENT_SECRET, so
 * without a check any site on the internet could use it as a free token-exchange
 * oracle for our Strava app.
 *
 * The expected origin is derived from the request's OWN url rather than an
 * allowlist, so it is automatically correct for tb.joshua-birch.co.uk,
 * tb2.joshua-birch.co.uk, every *.pages.dev preview and localhost — with no list
 * to forget to update when a domain is added.
 *
 * Be clear about what this does and does not buy: `Origin` and `Sec-Fetch-Site`
 * are set by the BROWSER and cannot be forged by a page, so this stops
 * cross-site abuse from other websites. It does NOT stop a determined caller
 * with curl, and nothing shipped in a public single-page app can — the only
 * thing that would is a secret the client holds, which in an SPA is not secret.
 * Rate limiting would be the next step if this were ever seen being hit.
 */
function sameOrigin(request: Request): boolean {
  // Modern browsers send this and it cannot be set by script.
  const site = request.headers.get('sec-fetch-site')
  if (site === 'same-origin') return true
  if (site && site !== 'none') return false

  const origin = request.headers.get('origin')
  if (!origin) return site === 'none' // a direct address-bar navigation, not a page
  try {
    return new URL(origin).origin === new URL(request.url).origin
  } catch {
    return false
  }
}

export async function onRequestPost(context: {
  request: Request
  env: Env
}): Promise<Response> {
  const { request, env } = context
  if (!sameOrigin(request)) {
    return json({ error: 'forbidden' }, 403)
  }
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
