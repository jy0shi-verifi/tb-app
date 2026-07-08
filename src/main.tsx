import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ensureSeeded } from './db'

ensureSeeded()

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
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
