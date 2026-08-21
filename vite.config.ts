import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// The in-progress rebuild deploys to its own origin (tb2.joshua-birch.co.uk) so the
// live app is never disturbed. Set APP_VARIANT=v2 for that build: it renames the PWA
// and the tab so two installed copies are tellable apart on the home screen.
const isV2 = process.env.APP_VARIANT === 'v2'
const APP_NAME = isV2 ? 'Tactical Barbell v2' : 'Tactical Barbell'
const SHORT_NAME = isV2 ? 'TB v2' : 'TB'

/** Retitle the document for the v2 build (index.html is otherwise static). */
function variantTitle() {
  return {
    name: 'variant-title',
    transformIndexHtml(html: string) {
      if (!isV2) return html
      return html
        .replace(/<title>[^<]*<\/title>/, `<title>${APP_NAME}</title>`)
        .replace(
          /(<meta name="apple-mobile-web-app-title" content=")[^"]*(")/,
          `$1${APP_NAME}$2`,
        )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  server: {
    // the preview harness reaches the project via an 8.3 short path (JOSHBI~1),
    // which trips Vite's fs allowlist — relax it for local dev.
    fs: { strict: false },
  },
  plugins: [
    react(),
    tailwindcss(),
    variantTitle(),
    VitePWA({
      // 'prompt' (not autoUpdate): a new build waits until the user taps "reload"
      // so it can't hot-swap chunks under a live 6am session (see UpdatePrompt).
      registerType: 'prompt',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: APP_NAME,
        short_name: SHORT_NAME,
        description: "Josh's personal Tactical Barbell trainer",
        theme_color: '#0b0c0e',
        background_color: '#0b0c0e',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // English-only app — don't precache the cyrillic/greek/vietnamese font subsets
        // (~170KB). They still fetch from network if ever needed while online.
        globIgnores: ['**/*cyrillic*.woff2', '**/*greek*.woff2', '**/*vietnamese*.woff2', 'icons.svg', 'favicon.svg'],
        navigateFallback: '/index.html',
      },
      devOptions: { enabled: false },
    }),
  ],
})
