import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

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
    VitePWA({
      // 'prompt' (not autoUpdate): a new build waits until the user taps "reload"
      // so it can't hot-swap chunks under a live 6am session (see UpdatePrompt).
      registerType: 'prompt',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Tactical Barbell',
        short_name: 'TB',
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
