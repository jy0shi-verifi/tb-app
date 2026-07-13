// Tactical Barbell app icon — a STRUCK-METAL challenge coin whose barbell "bar" is a
// kitted AR silhouette (photo cutout via cut_rifle.py). SVG -> PNG via Playwright.
// One warm key light, top-left (azimuth 135, elevation 58) obeyed everywhere.
import { chromium } from 'playwright'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, '..', 'public', 'icons')
const C = 256
const RIFLE_MASK = readFileSync(join(HERE, 'rifle_mask.png')).toString('base64')
const OSWALD = readFileSync(join(HERE, '..', 'node_modules', '@fontsource-variable', 'oswald', 'files', 'oswald-latin-wght-normal.woff2')).toString('base64')
const RX = 121, RY = 205, RW = 270, RH = 102
const BAR = 249

function defs() {
  const rays = Array.from({ length: 120 }, (_, i) => {
    const a = (i / 120) * 2 * Math.PI, a2 = a + 0.008, inr = 6, r = 150
    return `<path d="M${C + Math.cos(a) * inr} ${C + Math.sin(a) * inr} L${C + Math.cos(a) * r} ${C + Math.sin(a) * r} L${C + Math.cos(a2) * r} ${C + Math.sin(a2) * r} Z"/>`
  }).join('')
  const reeds = Array.from({ length: 90 }, (_, i) => {
    const a = (i / 90) * 2 * Math.PI
    return `<line x1="${C + Math.cos(a) * 207}" y1="${C + Math.sin(a) * 207}" x2="${C + Math.cos(a) * 217}" y2="${C + Math.sin(a) * 217}" stroke="url(#brass)" stroke-width="2.4"/>`
  }).join('')
  return `<defs>
    <style>@font-face{font-family:'OswaldEmbed';font-weight:200 700;src:url(data:font/woff2;base64,${OSWALD}) format('woff2');}</style>
    <path id="topArc" d="M ${C - 177} ${C} A 177 177 0 0 1 ${C + 177} ${C}"/>
    <path id="botArc" d="M ${C - 177} ${C} A 177 177 0 0 0 ${C + 177} ${C}"/>
    <radialGradient id="face" gradientUnits="userSpaceOnUse" cx="214" cy="206" r="238">
      <stop offset="0" stop-color="#1b1e24"/><stop offset="0.5" stop-color="#101318"/><stop offset="1" stop-color="#070809"/>
    </radialGradient>
    <linearGradient id="brass" gradientUnits="userSpaceOnUse" x1="150" y1="118" x2="372" y2="404">
      <stop offset="0" stop-color="#fbeeb4"/><stop offset="0.34" stop-color="#e8c24a"/><stop offset="0.72" stop-color="#a8761a"/><stop offset="1" stop-color="#6e3e0c"/>
    </linearGradient>
    <linearGradient id="brassEdge" gradientUnits="userSpaceOnUse" x1="150" y1="118" x2="372" y2="404">
      <stop offset="0" stop-color="#8a6a1f"/><stop offset="1" stop-color="#3a2708"/>
    </linearGradient>
    <linearGradient id="ember" gradientUnits="userSpaceOnUse" x1="${RX}" y1="${RY - 4}" x2="${RX + RW}" y2="${RY + RH + 8}">
      <stop offset="0" stop-color="#ff8a50"/><stop offset="0.42" stop-color="#e85a24"/><stop offset="0.78" stop-color="#c33f1b"/><stop offset="1" stop-color="#8f2a10"/>
    </linearGradient>
    <radialGradient id="vign" gradientUnits="userSpaceOnUse" cx="256" cy="252" r="196">
      <stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/>
    </radialGradient>
    <radialGradient id="sheen" gradientUnits="userSpaceOnUse" cx="192" cy="150" r="150">
      <stop offset="0" stop-color="#fff" stop-opacity="0.09"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>

    <filter id="bevel" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2.4" result="b"/>
      <feSpecularLighting in="b" surfaceScale="4" specularConstant="0.7" specularExponent="12" lighting-color="#ffe7a8" result="s">
        <feDistantLight azimuth="135" elevation="58"/>
      </feSpecularLighting>
      <feComposite in="s" in2="SourceAlpha" operator="in" result="sc"/>
      <feComposite in="SourceGraphic" in2="sc" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
    </filter>

    <filter id="relief" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="5.5" result="b"/>
      <feSpecularLighting in="b" surfaceScale="1" specularConstant="0.42" specularExponent="8" lighting-color="#ffcf9a" result="s">
        <feDistantLight azimuth="135" elevation="60"/>
      </feSpecularLighting>
      <feComposite in="s" in2="SourceAlpha" operator="in" result="sc"/>
      <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="sc"/></feMerge>
    </filter>

    <!-- directional relief for the rifle: dark drop to bottom-right, light catch top-left -->
    <filter id="ashadow" x="-30%" y="-30%" width="160%" height="160%"><feMorphology in="SourceAlpha" operator="dilate" radius="2" result="d"/><feOffset in="d" dx="1.6" dy="1.9"/></filter>
    <filter id="ahi" x="-30%" y="-30%" width="160%" height="160%"><feMorphology in="SourceAlpha" operator="dilate" radius="1.4" result="d"/><feOffset in="d" dx="-1.1" dy="-1.1"/></filter>

    <filter id="contact" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="b"/><feOffset in="b" dx="1" dy="4"/>
    </filter>
    <filter id="pan" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
      <feOffset in="SourceAlpha" dx="0" dy="5" result="o"/><feGaussianBlur in="o" stdDeviation="6" result="bb"/>
      <feComposite in="bb" in2="SourceAlpha" operator="out" result="ish"/>
      <feFlood flood-color="#000" flood-opacity="0.55"/><feComposite in2="ish" operator="in"/>
    </filter>
    <filter id="softblur"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="tight"><feGaussianBlur stdDeviation="5"/></filter>
    <filter id="glow" x="-70%" y="-70%" width="240%" height="240%" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="5" result="b"/>
      <feColorMatrix in="b" type="matrix" values="0 0 0 0 0.95  0 0 0 0 0.38  0 0 0 0 0.16  0 0 0 0.6 0"/>
    </filter>
    <filter id="deboss" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
      <feOffset in="SourceAlpha" dx="-1" dy="-1" result="a"/><feGaussianBlur in="a" stdDeviation="0.5" result="ab"/>
      <feFlood flood-color="#1a0f00" flood-opacity="0.9"/><feComposite in2="ab" operator="in" result="dk"/>
      <feOffset in="SourceAlpha" dx="0.9" dy="0.9" result="c"/><feGaussianBlur in="c" stdDeviation="0.5" result="cb"/>
      <feFlood flood-color="#fff3c4" flood-opacity="0.55"/><feComposite in2="cb" operator="in" result="lt"/>
      <feMerge><feMergeNode in="dk"/><feMergeNode in="SourceGraphic"/><feMergeNode in="lt"/></feMerge>
    </filter>
    <filter id="grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0"/>
    </filter>

    <mask id="rmask"><image href="data:image/png;base64,${RIFLE_MASK}" x="${RX}" y="${RY}" width="${RW}" height="${RH}" preserveAspectRatio="xMidYMid meet"/></mask>
    <clipPath id="coinClip"><circle cx="${C}" cy="${C}" r="200"/></clipPath>
    <g id="sun">${rays}</g>
    <g id="reed">${reeds}</g>
  </defs>`
}

const plate = (cx, w, h) =>
  `<g filter="url(#bevel)"><rect x="${cx - w / 2}" y="${BAR - h / 2}" width="${w}" height="${h}" rx="${w * 0.14}" fill="url(#brass)"/></g>`

// small struck 4-point star device
const star = (cx, cy) => `<path d="M${cx} ${cy - 10} L${cx + 2.5} ${cy - 2.5} L${cx + 10} ${cy} L${cx + 2.5} ${cy + 2.5} L${cx} ${cy + 10} L${cx - 2.5} ${cy + 2.5} L${cx - 10} ${cy} L${cx - 2.5} ${cy - 2.5} Z"/>`

function emblem(scale) {
  const plates = plate(150, 18, 82) + plate(129, 11, 58) + plate(362, 18, 82) + plate(383, 11, 58)
  const rifle = `
    <g transform="translate(${C} 249) scale(1.1) translate(${-C} ${-C})">
      <g filter="url(#contact)" mask="url(#rmask)"><rect x="${RX}" y="${RY}" width="${RW}" height="${RH}" fill="#000"/></g>
      <g filter="url(#ashadow)" mask="url(#rmask)"><rect x="${RX}" y="${RY}" width="${RW}" height="${RH}" fill="#160d05"/></g>
      <g filter="url(#ahi)" mask="url(#rmask)"><rect x="${RX}" y="${RY}" width="${RW}" height="${RH}" fill="#ffc79a" opacity="0.5"/></g>
      <g filter="url(#relief)"><g mask="url(#rmask)"><rect x="${RX}" y="${RY}" width="${RW}" height="${RH}" fill="url(#ember)"/></g></g>
      <g filter="url(#glow)"><ellipse cx="378" cy="243" rx="12" ry="7" fill="#ff6a3d"/></g>
      <ellipse cx="380" cy="243" rx="5" ry="3.2" fill="#ffe6cf"/>
      ${plates}
    </g>`
  return `
  <g transform="translate(${C} ${C}) scale(${scale}) translate(${-C} ${-C})">
    <!-- cast shadow (soft + tight) + milled edge so it reads as a photographed object -->
    <ellipse cx="${C}" cy="${C + 17}" rx="197" ry="195" fill="#000" opacity="0.5" filter="url(#softblur)"/>
    <ellipse cx="${C}" cy="${C + 7}" rx="201" ry="200" fill="#000" opacity="0.45" filter="url(#tight)"/>
    <circle cx="${C + 3}" cy="${C + 5}" r="205" fill="url(#brassEdge)"/>
    <circle cx="${C}" cy="${C}" r="204" fill="url(#face)"/>
    <g clip-path="url(#coinClip)">
      <use href="#sun" fill="#e8c24a" opacity="0.03"/>
      <g fill="none" stroke="#e8c24a" stroke-opacity="0.045"><circle cx="${C}" cy="${C}" r="140"/><circle cx="${C}" cy="${C}" r="104"/></g>
      <rect x="0" y="0" width="512" height="512" fill="url(#sheen)"/>
      <circle cx="${C}" cy="${C}" r="204" fill="url(#vign)"/>
      <circle cx="${C}" cy="${C}" r="177" fill="none" stroke="#0a0c10" stroke-opacity="0.5" stroke-width="30"/>
    </g>
    <circle cx="${C}" cy="${C}" r="198" fill="none" filter="url(#pan)"/>
    <use href="#reed"/>
    <g filter="url(#bevel)"><circle cx="${C}" cy="${C}" r="204" fill="none" stroke="url(#brass)" stroke-width="9"/></g>
    <circle cx="${C}" cy="${C}" r="163" fill="none" stroke="#3a2c0a" stroke-opacity="0.6" stroke-width="1.5"/>
    <g filter="url(#bevel)"><circle cx="${C}" cy="${C}" r="160" fill="none" stroke="url(#brass)" stroke-width="3.5"/></g>
    <circle cx="${C}" cy="${C}" r="156" fill="none" stroke="url(#ember)" stroke-width="2" stroke-opacity="0.4"/>
    <g font-family="OswaldEmbed, 'Arial Narrow', sans-serif" font-weight="600" fill="#d8ad3e" filter="url(#deboss)">
      <text font-size="25" letter-spacing="3"><textPath href="#topArc" startOffset="50%" text-anchor="middle">TACTICAL BARBELL</textPath></text>
      <text font-size="23" letter-spacing="4"><textPath href="#botArc" startOffset="50%" text-anchor="middle">BE A FUCKING PRO</textPath></text>
    </g>
    <g fill="#d8ad3e" filter="url(#deboss)">${star(C - 177, C)}${star(C + 177, C)}</g>
    ${rifle}
  </g>`
}

function svg({ maskable }) {
  const s = maskable ? 0.82 : 0.98
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  ${defs()}
  <rect width="512" height="512" fill="#0a0b0d"/>
  ${emblem(s)}
  <g clip-path="url(#coinClip)" transform="translate(${C} ${C}) scale(${s}) translate(${-C} ${-C})">
    <rect width="512" height="512" filter="url(#grain)" opacity="0.035"/>
  </g>
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
  const markup = svg({ maskable: t.maskable }).replace('width="512" height="512" viewBox', `width="${t.size}" height="${t.size}" viewBox`)
  await page.setViewportSize({ width: t.size, height: t.size })
  await page.setContent(`<!doctype html><html><body style="margin:0;padding:0;line-height:0">${markup}</body></html>`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: join(OUT, t.file), clip: { x: 0, y: 0, width: t.size, height: t.size } })
  console.log('wrote', t.file, t.size)
}
const fs = await import('fs')
fs.writeFileSync(join(OUT, '..', 'favicon.svg'), svg({ maskable: false }))
console.log('done')
await browser.close()
