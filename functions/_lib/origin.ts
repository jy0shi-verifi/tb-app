/** Same-origin guard for Pages Functions. Rejects cross-site POSTs that send an Origin. */

export function originOk(request: Request): boolean {
  const origin = request.headers.get('Origin')
  const self = new URL(request.url).origin
  if (origin) return origin === self
  const referer = request.headers.get('Referer')
  if (referer) {
    try {
      return new URL(referer).origin === self
    } catch {
      return false
    }
  }
  // No Origin/Referer (some same-origin or non-browser callers) — allow.
  return true
}

export function rejectOrigin(): Response {
  return new Response(JSON.stringify({ error: 'origin not allowed' }), {
    status: 403,
    headers: { 'content-type': 'application/json' },
  })
}
