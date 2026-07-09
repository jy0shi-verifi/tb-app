import { test, expect, seedState, readSessions, isoOffset, OP_MAXES } from './helpers'

async function importFile(page: import('@playwright/test').Page, obj: unknown) {
  await page.locator('input[type="file"]').setInputFiles({
    name: 'b.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(obj)),
  })
}

const OP = { currentPhaseId: 'operator', phaseStartDate: isoOffset(0), operatorBlock: 1 }

test('import rejects a backup missing its data tables', async ({ page }) => {
  await seedState(page, { settings: OP, maxes: OP_MAXES })
  await page.goto('/settings')
  await importFile(page, { app: 'tb-app', version: 1, settings: [{ id: 'app' }] })
  await expect(page.getByText(/Import failed/i)).toBeVisible()
})

test('import rejects a newer-version backup', async ({ page }) => {
  await seedState(page, { settings: OP, maxes: OP_MAXES })
  await page.goto('/settings')
  await importFile(page, { app: 'tb-app', version: 999, settings: [{ id: 'app' }], maxes: [], sessions: [] })
  await expect(page.getByText(/Import failed/i)).toBeVisible()
})

test('import rejects a backup with no app settings row', async ({ page }) => {
  await seedState(page, { settings: OP, maxes: OP_MAXES })
  await page.goto('/settings')
  await importFile(page, { app: 'tb-app', version: 1, settings: [{ id: 'other' }], maxes: [], sessions: [] })
  await expect(page.getByText(/Import failed/i)).toBeVisible()
})

test('a valid backup restores after confirmation', async ({ page }) => {
  await seedState(page, { settings: { currentPhaseId: 'base-building', phaseStartDate: isoOffset(0) } })
  await page.goto('/settings')
  page.on('dialog', (d) => d.accept())
  await importFile(page, {
    app: 'tb-app',
    version: 1,
    exportedAt: '2026-07-01T00:00:00Z',
    settings: [{ id: 'app', dbIncrement: 2, loadBasis: 'tm', currentPhaseId: 'operator', phaseStartDate: isoOffset(0), onboarded: true, operatorBlock: 1 }],
    maxes: [{ liftId: 'op_bench', testWeight: 20, testReps: 5, bumpKg: 0 }],
    sessions: [{ date: isoOffset(-2), phaseId: 'operator', week: 1, day: 0, type: 'lift', title: 'Restored Lift', exercises: [], done: true, createdAt: 1 }],
  })
  await expect(page.getByText(/Backup restored/i)).toBeVisible()
  expect((await readSessions(page)).some((r) => r.title === 'Restored Lift')).toBe(true)
})
