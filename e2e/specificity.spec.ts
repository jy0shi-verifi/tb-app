import { test, expect, mondayOffset, plusDays } from './helpers'

/**
 * Specificity Alpha / Bravo reach the session screen.
 * Grid arithmetic lives in unit tests; this checks the plan wires through.
 */

const MONDAY = mondayOffset(0)

const oneRm = (exerciseId: string, exerciseName: string, kg: number) => ({
  protocolId: 'mass',
  exerciseId,
  exerciseName,
  kg,
  unit: 'total',
  source: 'estimated',
  testedAt: MONDAY,
  progressedKg: 0,
})

test('an Alpha MS day shows the p.74 scheme and the deadlift override', async ({ page, seed }) => {
  await seed({
    settings: {
      currentPhaseId: 'gm',
      plan: { startDate: MONDAY, blocks: [{ protocolId: 'alpha', weeks: 3 }] },
    },
    oneRm: [
      oneRm('bench', 'Bench Press', 80),
      oneRm('squat', 'Squat', 100),
      oneRm('deadlift', 'Deadlift', 140),
    ],
  })
  await page.goto(`/session/${MONDAY}`)
  await expect(page.getByText('Alpha — MS')).toBeVisible()
  await expect(page.getByText('3 × 6 @ 75%')).toBeVisible()
  await expect(page.getByText('Bench Press', { exact: true })).toBeVisible()
  await expect(page.getByText('Deadlift', { exact: true })).toBeVisible()
})

test('a Bravo H1 day uses the early-week percentage, not Thursday’s bump', async ({ page, seed }) => {
  await seed({
    settings: {
      currentPhaseId: 'gm',
      plan: { startDate: MONDAY, blocks: [{ protocolId: 'bravo', weeks: 3 }] },
    },
    oneRm: [oneRm('bench', 'Bench Press', 80)],
  })
  await page.goto(`/session/${MONDAY}`)
  await expect(page.getByText('Bravo — H1')).toBeVisible()
  await expect(page.getByText('4–5 × 12 @ 50%')).toBeVisible()
  await expect(page.getByText('4–5 × 12 @ 55%')).toHaveCount(0)

  await page.goto(`/session/${plusDays(MONDAY, 3)}`)
  await expect(page.getByText('Bravo — H1')).toBeVisible()
  await expect(page.getByText('4–5 × 12 @ 55%')).toBeVisible()
})

test('the plan screen can append Alpha and Bravo blocks', async ({ page, seed }) => {
  await seed({ settings: { currentPhaseId: 'gm', phaseStartDate: MONDAY } })
  await page.goto('/plan')
  await page.getByRole('button', { name: 'Create a starter plan' }).click()
  await page.getByRole('button', { name: /Specificity Alpha/ }).click()
  await page.getByRole('button', { name: /Specificity Bravo/ }).click()
  await expect(page.getByText('Specificity Alpha', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Specificity Bravo', { exact: true }).first()).toBeVisible()
})
