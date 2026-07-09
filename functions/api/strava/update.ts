// Cloudflare Pages Function — POST /api/strava/update
// Server-side proxy to rename a Strava activity (PUT /activities/{id}). Strava's
// API sends no CORS headers, so a direct browser fetch is blocked — we forward
// it here. The client sends its own access token (needs activity:write scope).

export async function onRequestPost(context: { request: Request }): Promise<Response> {
  let body: { accessToken?: string; activityId?: number; name?: string }
  try {
    body = await context.request.json()
  } catch {
    return json({ error: 'invalid body' }, 400)
  }
  if (!body.accessToken || !body.activityId || !body.name) {
    return json({ error: 'missing accessToken, activityId or name' }, 400)
  }

  const res = await fetch(`https://www.strava.com/api/v3/activities/${body.activityId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${body.accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ name: body.name }),
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
