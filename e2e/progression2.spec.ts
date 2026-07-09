import { test, expect, seedState, readMaxes, isoOffset, completedBlockSessions, OP_MAXES } from './helpers'

test('force-progress bumps each max by its step and advances the block', async ({ page }) => {
  await seedState(page, {
    settings: {
      currentPhaseId: 'operator',
      phaseStartDate: isoOffset(-42),
      operatorBlock: 2,
      operatorFirstRunDone: true,
    },
    maxes: OP_MAXES,
    sessions: completedBlockSessions(),
  })
  // post-first-run block-complete shows the force-progress secondary action
  await page.getByRole('button', { name: /Force-progress/i }).click()

  await expect
    .poll(async () => (await readMaxes(page)).find((m) => m.liftId === 'op_bench')?.bumpKg)
    .toBe(2.5)
  const maxes = await readMaxes(page)
  expect(maxes.find((m) => m.liftId === 'op_squat')?.bumpKg).toBe(5) // lower-body step
})
