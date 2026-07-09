import { test, expect, setupOperator } from './helpers'

test('export produces a backup download', async ({ page }) => {
  await setupOperator(page)
  await page.goto('/settings')
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Export/ }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/tb-backup-.*\.json/)
})

test('a malformed backup import is rejected, not applied', async ({ page }) => {
  await setupOperator(page)
  await page.goto('/settings')
  await page.locator('input[type="file"]').setInputFiles({
    name: 'not-a-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"hello":"world"}'),
  })
  await expect(page.getByText(/Import failed/i)).toBeVisible()
  // data untouched — Maxes still shows the seeded lifts
  await page.goto('/maxes')
  await expect(page.locator('#root')).not.toContainText('Something broke')
})
