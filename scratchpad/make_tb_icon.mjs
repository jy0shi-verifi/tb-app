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

  // brass weight plates at each end (keeps the "loaded barbell" read)
  const plate = (cx, w, h) =>
    `<rect x="${cx - w / 2}" y="${C - h / 2}" width="${w}" height="${h}" rx="${w * 0.32}" fill="url(#brass)"/>` +
    `<rect x="${cx - w / 2 + 3}" y="${C - h / 2 + 3}" width="${w - 6}" height="${h - 6}" rx="${w * 0.24}" fill="none" stroke="#2a1e07" stroke-opacity="0.4" stroke-width="2"/>`
  const plates =
    plate(150, 22, 122) + plate(127, 16, 84) + // left
    plate(362, 22, 122) + plate(385, 16, 84)   // right

  // picatinny top-rail teeth
  const rail = Array.from({ length: 8 }, (_, i) =>
    `<rect x="${214 + i * 6.5}" y="243" width="3.6" height="5" rx="1" fill="#34383f"/>`).join('')

  // a kitted AR platform, muzzle left -> stock right (stylised for icon legibility)
  const rifle = `
    <g stroke="#1f2228" stroke-width="1.4" stroke-linejoin="round">
      <!-- suppressor -->
      <rect x="150" y="244" width="56" height="24" rx="10" fill="url(#steel)"/>
      <line x1="164" y1="247" x2="164" y2="265" stroke="#454a52" stroke-width="2"/>
      <line x1="178" y1="247" x2="178" y2="265" stroke="#454a52" stroke-width="2"/>
      <line x1="192" y1="247" x2="192" y2="265" stroke="#454a52" stroke-width="2"/>
      <!-- barrel + front sight post -->
      <rect x="206" y="251" width="10" height="10" fill="url(#steel)"/>
      <rect x="209" y="236" width="5" height="15" rx="1.5" fill="url(#steel)"/>
      <!-- handguard / rail -->
      <rect x="213" y="248" width="52" height="18" rx="3" fill="url(#steel)"/>
      <!-- receiver body -->
      <rect x="262" y="243" width="74" height="27" rx="4" fill="url(#steel)"/>
      <rect x="300" y="255" width="13" height="8" rx="1" fill="#25282e"/>
      <!-- optic on a raised mount + ember reticle -->
      <rect x="285" y="235" width="32" height="9" rx="2" fill="url(#steel)"/>
      <rect x="289" y="220" width="25" height="17" rx="3" fill="url(#steel)"/>
      <circle cx="301.5" cy="228" r="5" fill="url(#ember)" filter="url(#glow)"/>
      <circle cx="301.5" cy="228" r="2.6" fill="#ffdcc6" stroke="none"/>
      <!-- curved magazine -->
      <path d="M298 270 h20 q6 0 5 8 l-7 34 q-1 7 -8 7 h-9 q-6 0 -5 -7 l4 -35 q1 -7 5 -7 z" fill="url(#steel)"/>
      <!-- pistol grip -->
      <path d="M330 268 q13 1 11 15 l-3 15 q-1 6 -8 4 q-7 -2 -6 -11 l3 -19 q1 -6 3 -4 z" fill="url(#steel)"/>
      <!-- collapsible stock -->
      <path d="M334 245 h42 q6 0 6 6 v7 h-15 v9 q0 6 -6 6 h-21 q-6 0 -6 -6 z" fill="url(#steel)"/>
    </g>`

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
    ${plates}
    <!-- hot muzzle glow (ember = action) -->
    <g filter="url(#glow)"><ellipse cx="176" cy="256" rx="34" ry="17" fill="#ff6a3d"/></g>
    ${rail}
    ${rifle}
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
    <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d7dae0"/><stop offset="42%" stop-color="#9498a0"/><stop offset="100%" stop-color="#565b64"/>
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
