import { defineConfig, devices } from '@playwright/test'

const PORT = 5199

// End-to-end tests that drive the REAL app in a headless mobile browser —
// catching runtime / interaction / lifecycle bugs that a static code review
// can't see (e.g. state lost on refresh). Run: `npm run test:e2e`.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: false,
  retries: 1, // a transient dev-server hiccup under parallel load self-heals
  workers: 3,
  reporter: [['list']],
  timeout: 30_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    ...devices['Pixel 7'], // mobile viewport + touch — it's a phone PWA
  },
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
