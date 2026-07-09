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

test('warns to change progression rungs when retest gains stall', async ({ page }) => {
  await seedState(page, {
    settings: {
      currentPhaseId: 'operator',
      phaseStartDate: isoOffset(-42),
      operatorBlock: 2,
      operatorFirstRunDone: true,
      maxHistory: [{ date: isoOffset(-42), e1rm: 70 }], // current ~76.5 → +6.5 ≤ 10 → stalling
    },
    maxes: OP_MAXES,
  })
  await expect(page.getByText(/retests are slowing down/i)).toBeVisible()
  await expect(page.getByText(/check in with Claude/i)).toBeVisible()
})

test('no stall warning when the last retest gained well', async ({ page }) => {
  await seedState(page, {
    settings: {
      currentPhaseId: 'operator',
      phaseStartDate: isoOffset(-42),
      operatorBlock: 2,
      operatorFirstRunDone: true,
      maxHistory: [{ date: isoOffset(-42), e1rm: 50 }], // current ~76.5 → +26.5 > 10 → healthy
    },
    maxes: OP_MAXES,
  })
  await expect(page.getByText(/retests are slowing down/i)).toHaveCount(0)
})
