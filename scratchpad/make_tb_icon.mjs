// Generates the tb-app icon set: a tactical "challenge-coin barbell" emblem on
// blacked-out gunmetal with ember (action) + brass (achievement) — matching the
// Tactical Premium theme. Rendered via Playwright for crisp vector output.
import { chromium } from 'playwright'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')
const C = 256 // centre on a 512 viewBox

// --- emblem builder (coin + knurled brass rim + loaded barbell), scalable ---
function emblem(scale) {
  const knurl = Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2
    const r1 = 212, r2 = 226
    const x1 = C + Math.cos(a) * r1, y1 = C + Math.sin(a) * r1
    const x2 = C + Math.cos(a) * r2, y2 = C + Math.sin(a) * r2
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="url(#brass)" stroke-width="3.2" stroke-linecap="round" opacity="0.85"/>`
  }).join('')

  // a plate = tall rounded bar; pair of plates each side of the bar
  const plate = (cx, w, h) =>
    `<rect x="${cx - w / 2}" y="${C - h / 2}" width="${w}" height="${h}" rx="${w * 0.34}" fill="url(#brass)"/>` +
    `<rect x="${cx - w / 2 + 3}" y="${C - h / 2 + 3}" width="${w - 6}" height="${h - 6}" rx="${w * 0.28}" fill="none" stroke="#2a1e07" stroke-opacity="0.35" stroke-width="2"/>`

  const barbell =
    // bar
    `<rect x="150" y="246" width="212" height="20" rx="10" fill="url(#ember)"/>` +
    // collars
    `<rect x="214" y="240" width="12" height="32" rx="5" fill="url(#brass)"/>` +
    `<rect x="286" y="240" width="12" height="32" rx="5" fill="url(#brass)"/>` +
    // plates: inner (tall) + outer (short), each side
    plate(196, 26, 134) + plate(168, 20, 94) +
    plate(316, 26, 134) + plate(344, 20, 94)

  return `
  <g transform="translate(${C} ${C}) scale(${scale}) translate(${-C} ${-C})">
    <!-- coin face -->
    <circle cx="${C}" cy="${C}" r="206" fill="url(#coin)" stroke="url(#brass)" stroke-width="11"/>
    <!-- faint topo contours -->
    <g fill="none" stroke="#e8c24a" stroke-opacity="0.06">
      <circle cx="${C}" cy="${C}" r="168"/><circle cx="${C}" cy="${C}" r="128"/><circle cx="${C}" cy="${C}" r="92"/>
    </g>
    <!-- inner ember accent ring -->
    <circle cx="${C}" cy="${C}" r="188" fill="none" stroke="url(#ember)" stroke-width="2.5" stroke-opacity="0.55"/>
    ${knurl}
    <!-- barbell with ember glow -->
    <g filter="url(#glow)">${barbell}</g>
    <g>${barbell}</g>
  </g>`
}

function svg({ maskable }) {
  const bg = maskable
    ? `<rect width="512" height="512" fill="url(#gun)"/>`
    : `<rect width="512" height="512" rx="0" fill="url(#gun)"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="gun" cx="42%" cy="34%" r="80%">
      <stop offset="0%" stop-color="#1b1f25"/><stop offset="55%" stop-color="#101317"/><stop offset="100%" stop-color="#08090b"/>
    </radialGradient>
    <radialGradient id="coin" cx="42%" cy="36%" r="72%">
      <stop offset="0%" stop-color="#20242b"/><stop offset="70%" stop-color="#14171c"/><stop offset="100%" stop-color="#0c0e11"/>
    </radialGradient>
    <linearGradient id="ember" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ff9a5e"/><stop offset="48%" stop-color="#ff6a3d"/><stop offset="100%" stop-color="#d8451f"/>
    </linearGradient>
    <linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f7e29a"/><stop offset="45%" stop-color="#e8c24a"/><stop offset="100%" stop-color="#977719"/>
    </linearGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="9" result="b"/>
      <feColorMatrix in="b" type="matrix" values="0 0 0 0 1  0 0 0 0 0.42  0 0 0 0 0.24  0 0 0 0.9 0"/>
    </filter>
  </defs>
  ${bg}
  ${emblem(maskable ? 0.72 : 0.98)}
</svg>`
}

const targets = [
  { file: 'icon-512.png', size: 512, maskable: false },
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'maskable-512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: false },
  { file: 'favicon-64.png', size: 64, maskable: false },
]

const browser = await chromium.launch()
const page = await browser.newPage()
for (const t of targets) {
  const markup = svg({ maskable: t.maskable }).replace('width="512" height="512"', `width="${t.size}" height="${t.size}"`)
  await page.setViewportSize({ width: t.size, height: t.size })
  await page.setContent(`<!doctype html><html><body style="margin:0;padding:0;line-height:0">${markup}</body></html>`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: join(OUT, t.file), clip: { x: 0, y: 0, width: t.size, height: t.size } })
  console.log('wrote', t.file, t.size)
}
// standalone SVG favicon (browser tab)
const fs = await import('fs')
fs.writeFileSync(join(OUT, '..', 'favicon.svg'), svg({ maskable: false }))
console.log('wrote favicon.svg')
await browser.close()
