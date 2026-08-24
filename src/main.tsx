import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// self-hosted variable fonts (offline-safe, no CDN) — display + UI
import '@fontsource-variable/oswald' // condensed athletic display (hero numbers, wordmark)
import '@fontsource-variable/inter' // UI body
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'
import { applyTheme, db, ensureSeeded, requestPersistentStorage } from './db'
import { autoCompleteRestDays } from './lib/autocomplete'
import { snapshotOnOpen } from './lib/snapshots'

ensureSeeded().then(async () => {
  const s = await db.settings.get('app')
  applyTheme(s?.theme ?? 'system')
  await autoCompleteRestDays()
  // Protect the only copy of his data from silent eviction.
  await requestPersistentStorage()
  // ...and keep a rolling on-device snapshot, so no single destructive tap in
  // Settings is unrecoverable (audit A5). Throttled to one a day and silent on
  // failure — a backup that breaks the app it protects is worse than none.
  await snapshotOnOpen()
})

// dev-only: window.tbSeed() populates fake history, window.tbClear() resets
if (import.meta.env.DEV) {
  import('./dev/seed').then((m) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).tbSeed = m.seedFakeData
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).tbClear = m.clearAll
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
