import { test, expect, setupOperator } from './helpers'

test('fresh install shows onboarding without crashing', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /handled/i })).toBeVisible()
})

test('every screen renders (no crash / blank / error boundary)', async ({ page }) => {
  await setupOperator(page)
  for (const path of ['/', '/program', '/history', '/maxes', '/settings']) {
    await page.goto(path)
    // Layout's bottom nav renders on every in-app screen -> not a blank/crashed page
    await expect(page.locator('#root')).toContainText('Settings')
    await expect(page.locator('#root')).not.toContainText('Something broke')
  }
})
