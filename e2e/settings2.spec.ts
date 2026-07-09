import { test, expect, seedState, readSettings, isoOffset, OP_MAXES } from './helpers'

const OP = { currentPhaseId: 'operator', phaseStartDate: isoOffset(0), loadBasis: 'tm', operatorBlock: 1 }

test('load-basis change: cancelling the confirm is a no-op', async ({ page }) => {
  await seedState(page, { settings: OP, maxes: OP_MAXES })
  await page.goto('/settings')
  page.on('dialog', (d) => d.dismiss())
  await page.getByRole('button', { name: 'True 1RM' }).click()
  expect((await readSettings(page))?.loadBasis).toBe('tm')
})

test('load-basis change: accepting the confirm persists it', async ({ page }) => {
  await seedState(page, { settings: OP, maxes: OP_MAXES })
  await page.goto('/settings')
  page.on('dialog', (d) => d.accept())
  await page.getByRole('button', { name: 'True 1RM' }).click()
  await expect.poll(async () => (await readSettings(page))?.loadBasis).toBe('1rm')
})
