import { test, expect, seedState, isoOffset, mondayOffset } from './helpers'

test('a long lapse shows Welcome back and offers to resume the right week', async ({ page }) => {
  await seedState(page, {
    settings: { currentPhaseId: 'beginner', phaseStartDate: isoOffset(-84) }, // week 13
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
})

test('missed-session nudge shows and its dismissal survives a reload', async ({ page }) => {
  await seedState(page, {
    settings: {
      currentPhaseId: 'beginner',
      phaseStartDate: mondayOffset(-1),
    },
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
      currentPhaseId: 'beginner',
      phaseStartDate: mondayOffset(0),
    },
    sessions: [1, 2, 3].map((i) => ({
      date: isoOffset(-i),
      phaseId: 'beginner',
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
