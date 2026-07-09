import { test, expect, setupOperator } from './helpers'

test('rest-timer setting persists across reload', async ({ page }) => {
  await setupOperator(page)
  await page.goto('/settings')
  await page.getByRole('combobox').selectOption('120') // 2 min
  await page.reload()
  await expect(page.getByRole('combobox')).toHaveValue('120')
})

test('theme choice persists across reload', async ({ page }) => {
  await setupOperator(page)
  await page.goto('/settings')
  await page.getByRole('button', { name: 'Dark', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
})
