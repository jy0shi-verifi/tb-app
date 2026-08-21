import { test, expect, setupLiftWeek } from './helpers'

test('fresh install shows onboarding without crashing', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /handled/i })).toBeVisible()
})

test('every screen renders (no crash / blank / error boundary)', async ({ page }) => {
  await setupLiftWeek(page)
  for (const path of ['/', '/program', '/history', '/guide', '/settings']) {
    await page.goto(path)
    // Layout's bottom nav renders on every in-app screen -> not a blank/crashed page
    await expect(page.locator('#root')).toContainText('Settings')
    await expect(page.locator('#root')).not.toContainText('Something broke')
  }
})

// /maxes was the Tactical Barbell calculator and no longer exists. A bookmark or
// a stale PWA deep-link must land somewhere usable, not on a blank page.
test('a removed or unknown route falls back to Today', async ({ page }) => {
  await setupLiftWeek(page)
  for (const path of ['/maxes', '/nonsense']) {
    await page.goto(path)
    await expect(page.locator('#root')).toContainText('Settings') // nav still there
    await expect(page.locator('#root')).not.toContainText('Something broke')
  }
})
