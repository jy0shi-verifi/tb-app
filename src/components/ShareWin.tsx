import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { downloadBlob } from '../lib/download'

/** Read a CSS custom property off <html> so the share image matches the live theme. */
function cssVar(name: string, fallback: string): string {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    return v || fallback
  } catch {
    return fallback
  }
}

/** Draw a square, on-brand "range card" and return it as a PNG blob. */
async function buildImage(headline: string, sub: string): Promise<Blob | null> {
  const S = 1080
  const canvas = document.createElement('canvas')
  canvas.width = S
  canvas.height = S
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const hot = cssVar('--color-hot', '#ff8a4d')
  const rust = cssVar('--color-purple', '#d2451a')

  // gunmetal base with an ember diagonal — reads "tactical", not "greeting card"
  ctx.fillStyle = '#0b0c0e'
  ctx.fillRect(0, 0, S, S)
  const g = ctx.createLinearGradient(0, 0, S, S)
  g.addColorStop(0, hot)
  g.addColorStop(1, rust)
  ctx.globalAlpha = 0.9
  ctx.fillStyle = g
  ctx.fillRect(0, S * 0.62, S, S * 0.38)
  ctx.globalAlpha = 1

  // contour whispers (deterministic — no RNG)
  ctx.globalAlpha = 0.08
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  for (let i = 0; i < 7; i++) {
    ctx.beginPath()
    ctx.arc(S * 0.2, S * 0.25, 60 + i * 70, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  // fonts (self-hosted variable fonts; fall back to system if not ready)
  let display = '700 150px "Arial Narrow", system-ui, sans-serif'
  let displayWord = '700 66px "Arial Narrow", system-ui, sans-serif'
  let ui = '600 52px system-ui, sans-serif'
  try {
    await Promise.all([
      document.fonts.load("700 150px 'Oswald Variable'"),
      document.fonts.load("600 52px 'Inter Variable'"),
    ])
    display = "700 150px 'Oswald Variable', 'Arial Narrow', sans-serif"
    displayWord = "700 66px 'Oswald Variable', 'Arial Narrow', sans-serif"
    ui = "600 52px 'Inter Variable', system-ui, sans-serif"
  } catch {
    /* keep the system fallbacks */
  }

  ctx.textAlign = 'center'

  // eyebrow
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = "600 40px 'Inter Variable', system-ui, sans-serif"
  ctx.fillText('T A C T I C A L   B A R B E L L', S / 2, 250)

  // headline (condensed uppercase)
  ctx.fillStyle = '#ffffff'
  ctx.font = display
  ctx.fillText(headline.toUpperCase(), S / 2, 500)

  // sub line
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.font = ui
  ctx.fillText(sub, S / 2, 610)

  // wordmark bottom
  ctx.fillStyle = '#ffffff'
  ctx.font = displayWord
  ctx.fillText('TACTICAL BARBELL', S / 2, S - 90)

  return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}

/** "Share this win" — generates a branded image and shares it (or downloads as a fallback). */
export default function ShareWin({
  headline,
  sub,
  className = '',
}: {
  headline: string
  sub: string
  className?: string
}) {
  const [busy, setBusy] = useState(false)

  async function share() {
    if (busy) return
    setBusy(true)
    let blob: Blob | null = null // hoisted so the catch can still fall back to a download
    try {
      blob = await buildImage(headline, sub)
      const text = `${headline} — ${sub} · Tactical Barbell`
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
      if (blob && nav.canShare?.({ files: [new File([blob], 'tb-win.png', { type: 'image/png' })] }) && nav.share) {
        await nav.share({ files: [new File([blob], 'tb-win.png', { type: 'image/png' })], text })
        return
      }
      if (nav.share) {
        await nav.share({ text })
        return
      }
      if (blob) downloadBlob('tb-win.png', blob)
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError' && blob) downloadBlob('tb-win.png', blob)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={share}
      disabled={busy}
      className={`inline-flex items-center gap-1.5 text-sm font-bold underline disabled:opacity-50 ${className}`}
    >
      <Share2 size={15} /> {busy ? 'Making it…' : 'Share this win'}
    </button>
  )
}
