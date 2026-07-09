// Cloudflare Pages Function — POST /api/strava/activities
// Server-side proxy for the Strava activities list. Strava's API doesn't send
// CORS headers, so a direct browser fetch is blocked — we forward it here instead.
// The client sends its own access token (the user's own; no secret involved).

export async function onRequestPost(context: { request: Request }): Promise<Response> {
  let body: { accessToken?: string; after?: number }
  try {
    body = await context.request.json()
  } catch {
    return json({ error: 'invalid body' }, 400)
  }
  if (!body.accessToken) return json({ error: 'missing accessToken' }, 400)

  const url = new URL('https://www.strava.com/api/v3/athlete/activities')
  url.searchParams.set('after', String(body.after ?? 0))
  url.searchParams.set('per_page', '100')
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${body.accessToken}` },
  })
  const data = await res.json()
  return json(data, res.status)
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
