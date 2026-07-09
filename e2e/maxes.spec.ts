import { test, expect, seedState, isoOffset, OP_MAXES } from './helpers'

test('Base Building shows the "nothing to do yet" maxes state', async ({ page }) => {
  await seedState(page, {
    settings: { currentPhaseId: 'base-building', phaseStartDate: isoOffset(3) },
  })
  await page.goto('/maxes')
  await expect(page.getByText(/Nothing to do here yet/i)).toBeVisible()
})

test('Operator maxes populate the working-weights wave table', async ({ page }) => {
  await seedState(page, {
    settings: { currentPhaseId: 'operator', phaseStartDate: isoOffset(0), operatorBlock: 1 },
    maxes: OP_MAXES,
  })
  await page.goto('/maxes')
  // the 6-row wave table renders with the per-lift columns
  await expect(page.getByText('Scheme')).toBeVisible()
  await expect(page.getByRole('table')).toContainText('Bench')
})

test('a max above the 60kg dumbbell ceiling shows the ⚠ flag', async ({ page }) => {
  await seedState(page, {
    settings: { currentPhaseId: 'operator', phaseStartDate: isoOffset(0), operatorBlock: 1 },
    maxes: [
      { liftId: 'op_bench', testWeight: 70, testReps: 5, bumpKg: 0 }, // > 60kg ceiling
      { liftId: 'op_squat', testWeight: 28, testReps: 5, bumpKg: 0 },
      { liftId: 'op_row', testWeight: 18, testReps: 5, bumpKg: 0 },
    ],
  })
  await page.goto('/maxes')
  await expect(page.getByText('⚠︎').first()).toBeVisible()
})
