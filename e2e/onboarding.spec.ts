import { test, expect, seedState } from './helpers'

test('completing onboarding lands on Today and never returns', async ({ page }) => {
  await page.goto('/') // fresh install → onboarding
  await expect(page.getByRole('heading', { name: /handled/i })).toBeVisible()
  await page.getByRole('button', { name: /Get started/i }).click()
  await page.getByRole('button', { name: /Let's go/i }).click()
  // landed on Today — onboarding is gone (date-robust: start may be a countdown OR today)
  await expect(page.getByRole('heading', { name: /handled/i })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Today' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: /handled/i })).toHaveCount(0)
})

test('a legacy settings row without onboarded skips onboarding', async ({ page }) => {
  await seedState(page, {
    settings: { onboarded: undefined, currentPhaseId: 'base-building', phaseStartDate: '2026-06-01' },
  })
  await expect(page.getByRole('heading', { name: /handled/i })).toHaveCount(0)
})
