import { test, expect, seedState, readSettings } from './helpers'

/**
 * Onboarding — audit code-03 F4.
 *
 * A fresh install never heard the words "Grey Man": the flow was Beginner-only
 * copy with no choice, so reaching MASS meant knowing to open Settings and
 * change a dropdown. Both branches are covered here, because a choice that only
 * works one way is worse than no choice.
 */

test('a new install is offered Grey Man, and picking it lands on the 1RM screen', async ({
  page,
}) => {
  await page.goto('/') // fresh install → onboarding
  await expect(page.getByRole('heading', { name: /handled/i })).toBeVisible()
  await page.getByRole('button', { name: /Get started/i }).click()

  // The step that did not exist before.
  await expect(page.getByRole('heading', { name: /What are you running/i })).toBeVisible()
  await expect(page.getByText('Grey Man', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /Grey Man/i }).click()
  await page.getByRole('button', { name: /Continue/i }).click()
  await page.getByRole('button', { name: /Let's go/i }).click()

  // Grey Man cannot prescribe a weight without 1RMs, so it lands on the screen
  // that collects them rather than on a Today full of honest gaps.
  await expect(page).toHaveURL(/\/maxes/)
  await expect(page.getByRole('heading', { name: /Grey Man maxes/i })).toBeVisible()

  const s = await readSettings(page)
  expect(s!.currentPhaseId).toBe('gm')
  // ...and it starts on the book's Standard Cycle, truncated (p.140).
  const plan = s!.plan as { startDate: string; blocks: { protocolId: string }[] }
  expect(plan.blocks.map((b) => b.protocolId)).toEqual(['gm', 'gm', 'gm', 'gm', 'bridge'])
})

test('picking Beginner lands on Today and never returns to onboarding', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Get started/i }).click()
  await page.getByRole('button', { name: /Beginner Mode/i }).click()
  await page.getByRole('button', { name: /Continue/i }).click()
  await page.getByRole('button', { name: /Let's go/i }).click()

  await expect(page.getByRole('heading', { name: /handled/i })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Today' })).toBeVisible()

  const s = await readSettings(page)
  expect(s!.currentPhaseId).toBe('beginner')
  // Beginner runs the open-ended single phase, not a block plan.
  expect(s!.plan).toBeUndefined()

  await page.reload()
  await expect(page.getByRole('heading', { name: /handled/i })).toHaveCount(0)
})

test('the start date is snapped to a Monday whatever is typed (audit A16)', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Get started/i }).click()
  await page.getByRole('button', { name: /Grey Man/i }).click()
  await page.getByRole('button', { name: /Continue/i }).click()
  // 2026-08-19 is a Wednesday.
  await page.getByLabel('Start date').fill('2026-08-19')
  await page.getByRole('button', { name: /Let's go/i }).click()

  const s = await readSettings(page)
  // A non-Monday start does not shift a plan, it rotates it: Grey Man's
  // Mon/Wed/Fri would land on Wed/Fri/Sun while still being labelled "Mon".
  expect(s!.phaseStartDate).toBe('2026-08-17')
  expect((s!.plan as { startDate: string }).startDate).toBe('2026-08-17')
})

test('a legacy settings row without onboarded skips onboarding', async ({ page }) => {
  await seedState(page, {
    settings: { onboarded: undefined, currentPhaseId: 'beginner', phaseStartDate: '2026-06-01' },
  })
  await expect(page.getByRole('heading', { name: /handled/i })).toHaveCount(0)
})
