import { test, expect, seedState, readSettings, isoOffset, OP_MAXES, confirmDialog, cancelDialog } from './helpers'

const OP = { currentPhaseId: 'operator', phaseStartDate: isoOffset(0), loadBasis: 'tm', operatorBlock: 1 }

test('load-basis change: cancelling the confirm is a no-op', async ({ page }) => {
  await seedState(page, { settings: OP, maxes: OP_MAXES })
  await page.goto('/settings')
  await page.getByRole('radio', { name: 'True 1RM' }).click()
  await cancelDialog(page)
  expect((await readSettings(page))?.loadBasis).toBe('tm')
})

test('load-basis change: accepting the confirm persists it', async ({ page }) => {
  await seedState(page, { settings: OP, maxes: OP_MAXES })
  await page.goto('/settings')
  await page.getByRole('radio', { name: 'True 1RM' }).click()
  await confirmDialog(page, 'Change')
  await expect.poll(async () => (await readSettings(page))?.loadBasis).toBe('1rm')
})
