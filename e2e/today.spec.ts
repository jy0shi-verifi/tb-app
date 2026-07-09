import { test, expect, seedState, isoOffset, mondayOffset, OP_MAXES } from './helpers'

test('a lapse near phase end shows Welcome back, not an unearned Test Day', async ({ page }) => {
  await seedState(page, {
    settings: { currentPhaseId: 'base-building', phaseStartDate: isoOffset(-84) }, // week 13 → complete
    sessions: [
      {
        date: isoOffset(-14),
        phaseId: 'base-building',
        week: 4,
        day: 0,
        type: 'se',
        title: 'SE Circuit',
        exercises: [],
        done: true,
        createdAt: 1,
      },
    ],
  })
  await expect(page.getByText(/Welcome back/i)).toBeVisible()
  await expect(page.getByText(/Resume from week 4/i)).toBeVisible()
  await expect(page.getByText(/Test Day/i)).toHaveCount(0)
})

test('missed-session nudge shows and its dismissal survives a reload', async ({ page }) => {
  await seedState(page, {
    settings: {
      currentPhaseId: 'operator',
      phaseStartDate: mondayOffset(-1),
      operatorBlock: 1,
      operatorFirstRunDone: true,
    },
    maxes: OP_MAXES,
  })
  await expect(page.getByText(/^Missed /)).toBeVisible()
  await page.getByLabel('Dismiss').click()
  await expect(page.getByText(/^Missed /)).toBeHidden()
  await page.reload()
  await expect(page.getByText(/^Missed /)).toBeHidden()
})

test('backup nudge appears when there is data and no backup yet', async ({ page }) => {
  await seedState(page, {
    settings: {
      currentPhaseId: 'operator',
      phaseStartDate: mondayOffset(0),
      operatorBlock: 1,
      operatorFirstRunDone: true,
    },
    maxes: OP_MAXES,
    sessions: [1, 2, 3].map((i) => ({
      date: isoOffset(-i),
      phaseId: 'operator',
      week: 1,
      day: 0,
      type: 'lift',
      title: 'Operator — Week 1',
      exercises: [],
      done: true,
      createdAt: i,
    })),
  })
  await expect(page.getByText(/Back up your data/i)).toBeVisible()
})
