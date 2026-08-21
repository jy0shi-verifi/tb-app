import { test, expect, setupLiftWeek } from './helpers'

test('rest timer survives a page refresh (regression)', async ({ page }) => {
  const mon = await setupLiftWeek(page)
  await page.goto(`/session/${mon}`)

  const firstDone = page.getByLabel('Mark set done').first()
  await expect(firstDone).toBeVisible()
  await firstDone.click()

  // the Skip-rest control only exists while a rest is running
  await expect(page.getByLabel('Skip rest')).toBeVisible()

  await page.reload()
  // the bug we fixed: the timer used to vanish here
  await expect(page.getByLabel('Skip rest')).toBeVisible()
})

test('skipping the rest clears it (and stays cleared on reload)', async ({ page }) => {
  const mon = await setupLiftWeek(page)
  await page.goto(`/session/${mon}`)
  await page.getByLabel('Mark set done').first().click()
  await page.getByLabel('Skip rest').click()
  await expect(page.getByLabel('Skip rest')).toBeHidden()
  await page.reload()
  await expect(page.getByLabel('Skip rest')).toBeHidden()
})

test('direct weight entry + feel/notes journaling persists to History', async ({ page }) => {
  const mon = await setupLiftWeek(page)
  await page.goto(`/session/${mon}`)

  const weight = page.getByLabel('Weight per dumbbell').first()
  await weight.fill('20')
  await page.getByRole('button', { name: /Solid/ }).click()
  await page.getByPlaceholder(/Notes/i).fill('felt strong today')
  await page.getByLabel('Mark set done').first().click()

  await page.goto('/history')
  await page.getByText('details', { exact: false }).first().click()
  await expect(page.getByText('felt strong today')).toBeVisible()
})
