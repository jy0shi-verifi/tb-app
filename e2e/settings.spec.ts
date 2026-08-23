import { test, expect, setupLiftWeek } from './helpers'

test('rest-timer setting persists across reload', async ({ page }) => {
  await setupLiftWeek(page)
  await page.goto('/settings')
  // Target by label: Settings now has more than one <select> (Programme too).
  await page.getByLabel('Rest timer').selectOption('120') // 2 min
  await page.reload()
  await expect(page.getByLabel('Rest timer')).toHaveValue('120')
})

test('theme choice persists across reload', async ({ page }) => {
  await setupLiftWeek(page)
  await page.goto('/settings')
  await page.getByRole('button', { name: 'Dark', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
})
