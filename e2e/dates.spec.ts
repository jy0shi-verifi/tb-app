import { test, expect, seedState, isoOffset, OP_MAXES } from './helpers'

test('before the phase starts: BB countdown + first-week hint', async ({ page }) => {
  await seedState(page, {
    settings: { currentPhaseId: 'base-building', phaseStartDate: isoOffset(7) },
  })
  await expect(page.getByText(/Base Building starts in/i)).toBeVisible()
  await expect(page.getByText(/Your first week/i)).toBeVisible()
})

test('day 0 of the phase is active — Operator week 1', async ({ page }) => {
  await seedState(page, {
    settings: { currentPhaseId: 'operator', phaseStartDate: isoOffset(0), operatorBlock: 1 },
    maxes: OP_MAXES,
  })
  await expect(page.getByText(/Wk 1\/6/)).toBeVisible()
})

test('day 41 is still active — the final Operator week', async ({ page }) => {
  await seedState(page, {
    settings: {
      currentPhaseId: 'operator',
      phaseStartDate: isoOffset(-41),
      operatorBlock: 1,
      operatorFirstRunDone: true,
    },
    maxes: OP_MAXES,
  })
  await expect(page.getByText(/Wk 6\/6/)).toBeVisible()
})

test('day 42 flips to phase-complete (when not lapsed)', async ({ page }) => {
  await seedState(page, {
    settings: {
      currentPhaseId: 'operator',
      phaseStartDate: isoOffset(-42),
      operatorBlock: 1,
      operatorFirstRunDone: true,
    },
    maxes: OP_MAXES,
    sessions: [
      {
        date: isoOffset(-1),
        phaseId: 'operator',
        week: 6,
        day: 4,
        type: 'lift',
        title: 'Operator — Week 6',
        exercises: [],
        done: true,
        createdAt: 1,
      },
    ],
  })
  await expect(page.getByText(/Operator block done/i)).toBeVisible()
})
