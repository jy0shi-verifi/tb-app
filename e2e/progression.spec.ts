import { test, expect, seedState, isoOffset, completedBlockSessions, OP_MAXES } from './helpers'

test('block-complete on the first run recommends holding the weights', async ({ page }) => {
  await seedState(page, {
    settings: {
      currentPhaseId: 'operator',
      phaseStartDate: isoOffset(-42),
      operatorBlock: 1,
      operatorFirstRunDone: false,
    },
    maxes: OP_MAXES,
    sessions: completedBlockSessions(),
  })
  await expect(page.getByText(/Start next block — same weights/i)).toBeVisible()
})

test('block-complete after the first run recommends a retest', async ({ page }) => {
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
  await expect(page.getByRole('button', { name: /Retest my maxes/i })).toBeVisible()
})

test('an unfinished block (missing heavy weeks) recommends repeating it', async ({ page }) => {
  await seedState(page, {
    settings: {
      currentPhaseId: 'operator',
      phaseStartDate: isoOffset(-42),
      operatorBlock: 1,
      operatorFirstRunDone: false,
    },
    maxes: OP_MAXES,
    // only a recent final-week lift, no heavy weeks 3&6 → blockCompleted() false
    sessions: [
      {
        date: isoOffset(-3),
        phaseId: 'operator',
        week: 6,
        day: 0,
        type: 'lift',
        title: 'Operator — Week 6',
        exercises: [],
        done: true,
        createdAt: 1,
      },
    ],
  })
  await expect(page.getByText(/Repeat this block/i)).toBeVisible()
})

test('warns to change progression rungs when a lift stalls', async ({ page }) => {
  await seedState(page, {
    settings: {
      currentPhaseId: 'operator',
      phaseStartDate: isoOffset(-42),
      operatorBlock: 2,
      operatorFirstRunDone: true,
      // bench now ~24.75; prev 23 → +1.75 ≤ its 2.5 bump → stalled
      maxHistory: [{ date: isoOffset(-42), lifts: { op_bench: 23, op_squat: 20, op_row: 15 } }],
    },
    maxes: OP_MAXES,
  })
  await expect(page.getByText(/A lift's retests are slowing down/i)).toBeVisible()
  await expect(page.getByText(/check in with Claude/i)).toBeVisible()
})

test('no stall warning when every lift gained well', async ({ page }) => {
  await seedState(page, {
    settings: {
      currentPhaseId: 'operator',
      phaseStartDate: isoOffset(-42),
      operatorBlock: 2,
      operatorFirstRunDone: true,
      // every lift out-gained its bump
      maxHistory: [{ date: isoOffset(-42), lifts: { op_bench: 20, op_squat: 24, op_row: 16 } }],
    },
    maxes: OP_MAXES,
  })
  await expect(page.getByText(/retests are slowing down/i)).toHaveCount(0)
})
