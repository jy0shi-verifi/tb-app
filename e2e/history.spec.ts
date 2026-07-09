import { test, expect, seedState, isoOffset, OP_MAXES } from './helpers'

const OP = { currentPhaseId: 'operator', phaseStartDate: isoOffset(0), operatorBlock: 1 }

test('History shows the empty state when nothing is logged', async ({ page }) => {
  await seedState(page, { settings: OP, maxes: OP_MAXES })
  await page.goto('/history')
  await expect(page.getByText(/No sessions logged yet/i)).toBeVisible()
})

test('deleting a session from History removes it and persists', async ({ page }) => {
  await seedState(page, {
    settings: OP,
    maxes: OP_MAXES,
    sessions: [
      {
        date: isoOffset(-1),
        phaseId: 'operator',
        week: 1,
        day: 0,
        type: 'lift',
        title: 'A Lift',
        exercises: [],
        done: true,
        createdAt: 1,
      },
    ],
  })
  await page.goto('/history')
  await expect(page.getByText('A Lift')).toBeVisible()
  page.on('dialog', (d) => d.accept())
  await page.getByLabel('Delete session').first().click()
  await expect(page.getByText('A Lift')).toBeHidden()
  await page.reload()
  await expect(page.getByText('A Lift')).toHaveCount(0)
})
