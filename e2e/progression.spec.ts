import { test, expect, mondayOffset, readOneRm, readSettings } from './helpers'

/**
 * Forced Progression end to end — MASS p.53, p.90.
 *
 * The unit suite covers the arithmetic. What only a browser can cover is the
 * thing that actually went wrong here: the tick boxes were seeded from
 * `suggestProgression` inside a `useEffect`, and `useSessions()` returns `[]`
 * while IndexedDB is still loading — so every lift came back ticked, including
 * ones explicitly marked "struggled". Every unit test passed. The screen showed
 * it immediately.
 *
 * These tests therefore assert the ticks against seeded HISTORY, not just that
 * the page renders.
 */

/** Block 1 started three weeks ago, so today is block 2 day 1 — a boundary. */
const BLOCK_1_START = mondayOffset(-3)
const TODAY_MONDAY = mondayOffset(0)

const oneRm = (exerciseId: string, exerciseName: string, kg: number, extra = {}) => ({
  protocolId: 'mass',
  exerciseId,
  exerciseName,
  kg,
  unit: 'total',
  source: 'estimated',
  testedAt: BLOCK_1_START,
  progressedKg: 0,
  ...extra,
})

const liftSession = (
  date: string,
  exercises: { name: string; reps: number[]; struggled?: boolean }[],
) => ({
  date,
  phaseId: 'gm',
  week: 1,
  day: 0,
  type: 'lift',
  title: 'Grey Man — Day A',
  exercises: exercises.map((e) => ({
    name: e.name,
    sets: e.reps.map((r) => ({ weight: 70, reps: r, done: true })),
    ...(e.struggled ? { struggled: true } : {}),
  })),
  done: true,
  createdAt: 1,
})

const AT_BOUNDARY = {
  settings: {
    currentPhaseId: 'gm',
    phaseStartDate: BLOCK_1_START,
    plan: {
      startDate: BLOCK_1_START,
      blocks: [
        { protocolId: 'gm', weeks: 3 },
        { protocolId: 'gm', weeks: 3 },
      ],
    },
  },
  oneRm: [
    oneRm('bench', 'Bench Press', 100),
    oneRm('squat', 'Squat', 140),
    oneRm('ohp', 'Overhead Press', 60),
    oneRm('deadlift', 'Deadlift', 180),
  ],
  sessions: [
    // Bench and Deadlift clean; Overhead Press explicitly marked a struggle.
    liftSession(BLOCK_1_START, [
      { name: 'Bench Press', reps: [8, 8, 8, 8] },
      { name: 'Deadlift', reps: [8, 8, 8, 8] },
    ]),
    liftSession(mondayOffset(-2), [{ name: 'Overhead Press', reps: [8, 8, 8, 8], struggled: true }]),
    // Squat logged short of its own session's best — the derived hint.
    liftSession(mondayOffset(-1), [{ name: 'Squat', reps: [8, 8, 5, 5] }]),
  ],
}

test('the block-boundary prompt appears on Today and reaches the progression screen', async ({
  page,
  seed,
}) => {
  await seed(AT_BOUNDARY)
  await page.goto('/')

  await expect(page.getByText(/Block 1 is done/i)).toBeVisible()
  await page.getByRole('button', { name: /Review your maxes/i }).click()
  await expect(page).toHaveURL(/\/progression/)
  await expect(page.getByText(/Every 3 to 6 weeks/)).toBeVisible()
})

test('each lift gets the choice the block earned it — read from real history', async ({
  page,
  seed,
}) => {
  await seed(AT_BOUNDARY)
  await page.goto('/progression')

  // This is the regression the derived-state fix exists for: before it, every
  // lift proposed a full increment, because the suggestion was computed before
  // the session history had loaded.
  await expect(page.getByRole('button', { name: 'Bench Press Full' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByRole('button', { name: 'Deadlift Full' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  // "Don't force progression for exercises you struggled with" (p.53).
  await expect(page.getByRole('button', { name: 'Overhead Press Hold' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByText(/You marked this a struggle/)).toBeVisible()
  // Sets logged short of the rest — the middle gear, not a full stop.
  await expect(page.getByRole('button', { name: 'Squat Half' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByText(/logged short of the rest/)).toBeVisible()
})

test('lower body gets the top of the book’s range and upper body the bottom', async ({
  page,
  seed,
}) => {
  await seed(AT_BOUNDARY)
  await page.goto('/progression')

  // MASS says "5-10lbs" and never which is which; TB1 says 10 lb lower, 5 lb
  // upper. 4.5 kg and 2.5 kg. Declared on screen as our reading, not the book's.
  await expect(page.getByRole('button', { name: 'Deadlift Full' })).toContainText('4.5')
  await expect(page.getByRole('button', { name: 'Bench Press Full' })).toContainText('2.5')
  await expect(page.getByText(/our reading, not this book/i)).toBeVisible()
})

test('one tap overrides any lift the app got wrong', async ({ page, seed }) => {
  await seed(AT_BOUNDARY)
  await page.goto('/progression')

  // Squat was eased; insist on the full increment instead.
  await page.getByRole('button', { name: 'Squat Full' }).click()
  await expect(page.getByRole('button', { name: 'Squat Full' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('button', { name: /Apply to/ }).click()

  const rows = await readOneRm(page)
  expect(rows.find((r) => r.exerciseId === 'squat')!.progressedKg).toBe(4.5)
})

test('applying writes each lift its own increment and stamps the block', async ({ page, seed }) => {
  await seed(AT_BOUNDARY)
  await page.goto('/progression')

  await page.getByRole('button', { name: /Apply to/ }).click()
  await expect(page).toHaveURL(/\/$|\/#\/$/)

  const rows = await readOneRm(page)
  const by = (id: string) => rows.find((r) => r.exerciseId === id)!
  expect(by('bench').progressedKg).toBe(2.5) // clean, upper body
  expect(by('deadlift').progressedKg).toBe(4.5) // clean, lower body
  // Sets logged short → half, not a full stop.
  expect(by('squat').progressedKg).toBe(2.3)
  // Left exactly where it was, per p.53.
  expect(by('ohp').progressedKg).toBe(0)
  // The tested figure is never overwritten.
  expect(by('bench').kg).toBe(100)

  const settings = await readSettings(page)
  expect((settings?.mass as { progressedBlocks?: string[] } | undefined)?.progressedBlocks).toContain(
    BLOCK_1_START,
  )

  // Answered — so it stops asking.
  await page.goto('/')
  await expect(page.getByText(/Block 1 is done/i)).toHaveCount(0)
})

test('the progressed max reaches the session screen as a heavier bar', async ({ page, seed }) => {
  await seed(AT_BOUNDARY)

  // Week 1 of block 2, day A: bench at 70% of its 1RM.
  await page.goto(`/session/${TODAY_MONDAY}`)
  await expect(page.getByText('70 kg', { exact: false }).first()).toBeVisible()

  await page.goto('/progression')
  await page.getByRole('button', { name: /Apply to/ }).click()

  await page.goto(`/session/${TODAY_MONDAY}`)
  // 70% of 102.5 = 71.75, which loads as 72.5 on a standard kg bar.
  await expect(page.getByText('72.5 kg', { exact: false }).first()).toBeVisible()
})

test('"Not now" leaves the block unanswered so it asks again', async ({ page, seed }) => {
  await seed(AT_BOUNDARY)
  await page.goto('/progression')

  await page.getByRole('button', { name: 'Not now' }).click()
  await page.goto('/')
  await expect(page.getByText(/Block 1 is done/i)).toBeVisible()
})
