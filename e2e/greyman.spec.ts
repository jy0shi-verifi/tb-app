import { test, expect, mondayOffset, plusDays, readOneRm } from './helpers'

/**
 * Grey Man end to end, in a real browser.
 *
 * The unit suite already asserts the book's grid; what this covers is the part
 * unit tests cannot see — that the plan reaches the screen, that a barbell load
 * is not labelled "kg/DB", and that Beginner's progression UI does not leak into
 * a MASS session (it did, until the protocol scoping was added).
 */

const MONDAY = mondayOffset(0)

const oneRm = (exerciseId: string, exerciseName: string, kg: number, extra = {}) => ({
  protocolId: 'mass',
  exerciseId,
  exerciseName,
  kg,
  unit: 'total',
  source: 'estimated',
  testedAt: MONDAY,
  progressedKg: 0,
  ...extra,
})

const GM = {
  settings: { currentPhaseId: 'gm', phaseStartDate: MONDAY },
  oneRm: [
    oneRm('bench', 'Bench Press', 80),
    oneRm('squat', 'Squat', 100),
    oneRm('ohp', 'Overhead Press', 47.5),
    oneRm('deadlift', 'Deadlift', 120),
  ],
}

test('a Grey Man A day shows the book’s lifts, loads and plate breakdown', async ({ page, seed }) => {
  await seed(GM)
  await page.goto(`/session/${MONDAY}`)

  await expect(page.getByText('Grey Man — Day A')).toBeVisible()
  // Week 1 main: 4-5 x 8 @ 70% (MASS p.51).
  await expect(page.getByText('4–5 × 8 @ 70%')).toBeVisible()
  await expect(page.getByText('Bench Press', { exact: true })).toBeVisible()
  await expect(page.getByText('Squat', { exact: true })).toBeVisible()

  // 70% of 100 = 70 kg exactly, loaded as one 25 per side.
  await expect(page.getByText('25 per side · exact')).toBeVisible()
  // 70% of 80 = 56 -> nearest loadable 55, and the unrounded target stays visible.
  await expect(page.getByText('15 + 2.5 per side · target 56 kg')).toBeVisible()
})

test('a barbell load is not labelled kg/DB', async ({ page, seed }) => {
  await seed(GM)
  await page.goto(`/session/${MONDAY}`)
  await expect(page.getByText('Grey Man — Day A')).toBeVisible()
  // The Session screen used to hardcode "kg/DB" under every weight, which is
  // wrong by a factor of two for a bar.
  await expect(page.locator('text=kg/DB')).toHaveCount(0)
})

test('Beginner’s double-progression badge does not leak into a MASS session', async ({ page, seed }) => {
  await seed(GM)
  await page.goto(`/session/${MONDAY}`)
  await expect(page.getByText('Grey Man — Day A')).toBeVisible()
  // Gated on `type === 'lift'` alone, this appeared on Grey Man days too.
  await expect(page.getByText('+2 kg')).toHaveCount(0)
})

test('the A/B alternation follows the sessions, not the weekday', async ({ page, seed }) => {
  await seed(GM)
  // Week 1: Mon A, Wed B, Fri A.
  await page.goto(`/session/${MONDAY}`)
  await expect(page.getByText('Grey Man — Day A')).toBeVisible()
  await page.goto(`/session/${plusDays(MONDAY, 2)}`)
  await expect(page.getByText('Grey Man — Day B')).toBeVisible()
  await page.goto(`/session/${plusDays(MONDAY, 4)}`)
  await expect(page.getByText('Grey Man — Day A')).toBeVisible()
  // Week 2 Monday flips to B — a weekday-based selector would say A.
  await page.goto(`/session/${plusDays(MONDAY, 7)}`)
  await expect(page.getByText('Grey Man — Day B')).toBeVisible()
})

test('a missing 1RM says so instead of inventing a weight', async ({ page, seed }) => {
  await seed({ settings: { currentPhaseId: 'gm', phaseStartDate: MONDAY } })
  await page.goto(`/session/${MONDAY}`)
  await expect(page.getByText('Set your 1RM for Bench Press to see the working weight (70%).')).toBeVisible()
})

test('the maxes screen estimates a 1RM from a test set and stores it scoped to MASS', async ({ page, seed }) => {
  await seed({ settings: { currentPhaseId: 'gm', phaseStartDate: MONDAY } })
  await page.goto('/maxes')
  await expect(page.getByText('Grey Man maxes')).toBeVisible()

  // `exact` matters: "Front Squat test weight" also contains "Squat test weight".
  await page.getByLabel('Squat test weight', { exact: true }).fill('100')
  await page.getByLabel('Squat test reps', { exact: true }).fill('3')

  // Brzycki: 100 x 36 / (37-3) = 105.9 (MASS p.90 sanctions estimating).
  await expect(page.getByText('1RM 105.9 kg')).toBeVisible()

  const rows = await readOneRm(page)
  const squat = rows.find((r) => r.exerciseId === 'squat')!
  expect(squat.protocolId).toBe('mass')
  expect(squat.source).toBe('estimated')
  expect(squat.kg).toBeCloseTo(105.9, 1)
})
