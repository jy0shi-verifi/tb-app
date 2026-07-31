// Uses the BASE Playwright test (not ./helpers) on purpose: helpers' auto-fixture
// sets `tb-no-splash` to suppress the intro everywhere else. Here we want it to play.
import { test, expect } from '@playwright/test'

test('cold-open intro splash shows the motto, then clears into the app', async ({ page }) => {
  await page.goto('/')
  const splash = page.getByTestId('intro-splash')
  await expect(splash).toBeVisible()
  await expect(splash).toContainText('fucking')
  // it auto-dismisses (~1.5s hold + fade) and unmounts
  await expect(splash).toBeHidden({ timeout: 5000 })
})

test('tapping the splash skips it immediately', async ({ page }) => {
  await page.goto('/')
  const splash = page.getByTestId('intro-splash')
  await expect(splash).toBeVisible()
  await splash.click()
  await expect(splash).toBeHidden({ timeout: 2000 })
})
