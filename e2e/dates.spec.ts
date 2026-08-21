import { test, expect, seedState, isoOffset } from './helpers'

test('before the phase starts: countdown + first-week hint', async ({ page }) => {
  await seedState(page, {
    settings: { currentPhaseId: 'beginner', phaseStartDate: isoOffset(7) },
  })
  await expect(page.getByText(/Beginner starts in/i)).toBeVisible()
  await expect(page.getByText(/Your first week/i)).toBeVisible()
})

test('day 0 of the phase is active — week 1', async ({ page }) => {
  await seedState(page, {
    settings: { currentPhaseId: 'beginner', phaseStartDate: isoOffset(0) },
  })
  await expect(page.getByRole('main').getByText(/Beginner · Wk 1/)).toBeVisible()
})

test('week rolls over on the 7-day boundary', async ({ page }) => {
  await seedState(page, {
    settings: { currentPhaseId: 'beginner', phaseStartDate: isoOffset(-7) },
  })
  await expect(page.getByRole('main').getByText(/Beginner · Wk 2/)).toBeVisible()
})

test('a long-running programme keeps counting — beginner never "completes"', async ({ page }) => {
  await seedState(page, {
    settings: { currentPhaseId: 'beginner', phaseStartDate: isoOffset(-42) },
  })
  await expect(page.getByRole('main').getByText(/Beginner · Wk 7/)).toBeVisible()
})

// A restored backup (or an install from before the Tactical Barbell programme was
// removed) can still carry a TB phase id. It must resolve, not blank the app.
test('an unknown stored phase falls back rather than blanking the app', async ({ page }) => {
  await seedState(page, {
    settings: { currentPhaseId: 'operator', phaseStartDate: isoOffset(0) },
  })
  await expect(page.getByRole('main').getByText(/Beginner · Wk 1/)).toBeVisible()
})
