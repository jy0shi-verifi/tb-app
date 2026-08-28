import { test, expect, mondayOffset, plusDays, readSettings } from './helpers'

/**
 * Block plan, supplementary cluster and conditioning — steps 7–9.
 *
 * These are the parts the book deliberately leaves to the reader, so what is
 * asserted here is mostly that the app enforces the book's LIMITS while leaving
 * the choices open.
 */

const MONDAY = mondayOffset(0)

const planned = (blocks: { protocolId: string; weeks: number }[]) => ({
  settings: { currentPhaseId: 'gm', plan: { startDate: MONDAY, blocks } },
})

test('a block plan drives which protocol each week runs', async ({ page, seed }) => {
  await seed(
    planned([
      { protocolId: 'gm', weeks: 3 },
      { protocolId: 'bridge', weeks: 1 },
      { protocolId: 'gm', weeks: 3 },
    ]),
  )

  await page.goto(`/session/${MONDAY}`)
  await expect(page.getByText('Grey Man — Day A')).toBeVisible()

  // Week 4 is the bridge week: Mon is a rest day, Thu is an optional test day.
  await page.goto(`/session/${plusDays(MONDAY, 21)}`)
  await expect(page.getByText('Bridge — rest')).toBeVisible()
  await page.goto(`/session/${plusDays(MONDAY, 24)}`)
  await expect(page.getByText('Bridge — test day (optional)')).toBeVisible()

  // Week 5 opens the next block back at week 1 — so Day A again, not Day B.
  await page.goto(`/session/${plusDays(MONDAY, 28)}`)
  await expect(page.getByText('Grey Man — Day A')).toBeVisible()
})

test('Green conditioning fills a non-lifting day with the book’s card', async ({ page, seed }) => {
  await seed(planned([{ protocolId: 'gm', weeks: 3 }]))
  await page.goto(`/session/${plusDays(MONDAY, 1)}`) // Tuesday
  await expect(page.getByText('Walk', { exact: true })).toBeVisible()
  await expect(page.getByText('Walk x 30-60 Minutes')).toBeVisible()
  await expect(page.getByText(/Green conditioning/)).toBeVisible()
})

test('conditioning never displaces a lifting day', async ({ page, seed }) => {
  await seed({
    settings: {
      currentPhaseId: 'gm',
      plan: { startDate: MONDAY, blocks: [{ protocolId: 'gm', weeks: 3 }] },
      // Ask for conditioning on all three lifting days.
      mass: { conditioningDays: [0, 2, 4] },
    },
  })
  await page.goto(`/session/${MONDAY}`)
  await expect(page.getByText('Grey Man — Day A')).toBeVisible()
})

test('the plan screen builds a starter plan and shows where you are', async ({ page, seed }) => {
  await seed({ settings: { currentPhaseId: 'gm', phaseStartDate: MONDAY } })
  await page.goto('/plan')

  await expect(page.getByText('No block plan yet', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Create a starter plan' }).click()

  await expect(page.getByText('13 weeks in total', { exact: false })).toBeVisible()
  // `exact` matters: the "+ Bridge week" add button also contains the words.
  await expect(page.getByText('Bridge Week', { exact: true })).toBeVisible()

  const s = await readSettings(page)
  expect(s).toBeDefined()
  expect((s!.plan as { blocks: unknown[] }).blocks).toHaveLength(5)
})

test('the S-cluster builder enforces the book’s 4–6 limit', async ({ page, seed }) => {
  await seed({ settings: { currentPhaseId: 'gm', phaseStartDate: MONDAY } })
  await page.goto('/plan')

  // The book's example is 5 (3 + 2).
  await expect(page.getByText('5 of 4–6')).toBeVisible()

  await page.getByLabel('New supplementary exercise').fill('Barbell Curl')
  await page.getByRole('button', { name: 'Add to S' }).click()
  await expect(page.getByText('6 of 4–6')).toBeVisible()

  // "Use no more than 4 to 6" (p.49) — at 6 the Add button is disabled.
  await page.getByLabel('New supplementary exercise').fill('Calf Raise')
  await expect(page.getByRole('button', { name: 'Add to S' })).toBeDisabled()
})

test('a custom S cluster reaches the session', async ({ page, seed }) => {
  await seed({
    settings: {
      currentPhaseId: 'gm',
      plan: { startDate: MONDAY, blocks: [{ protocolId: 'gm', weeks: 3 }] },
      mass: {
        sCluster: {
          s1: [{ id: 's_curl', name: 'Barbell Curl', defaultLoading: 'barbell' }],
          s2: [{ id: 's_calf', name: 'Calf Raise', defaultLoading: 'dumbbell' }],
        },
      },
    },
  })
  await page.goto(`/session/${MONDAY}`)
  // `exact` matters: the "Set your 1RM for Barbell Curl" note contains it too.
  await expect(page.getByText('Barbell Curl', { exact: true })).toBeVisible()
  await expect(page.getByText('Dips')).toHaveCount(0)
})

// ---------------------------------------------------------------------------
// Audit fixes, 2026-08-24. Program.tsx had ZERO assertions before this, which is
// how it shipped building its calendar from `phaseStartDate` and showing dates
// months out of date under a block plan.
// ---------------------------------------------------------------------------

test('Program follows the block plan, not the stale phase start date', async ({ page, seed }) => {
  await seed(
    planned([
      { protocolId: 'gm', weeks: 3 },
      { protocolId: 'bridge', weeks: 1 },
    ]),
  )
  await page.goto('/program')

  // Week 1 of the plan starts on MONDAY, and the dates shown must be that week —
  // not dates derived from settings.phaseStartDate.
  const monday = Number(MONDAY.slice(8, 10))
  await expect(page.getByText('Grey Man', { exact: true }).first()).toBeVisible()
  await expect(page.getByText(String(monday), { exact: true }).first()).toBeVisible()
})

test('Program labels the bridge week as the bridge, not as Grey Man', async ({ page, seed }) => {
  // A plan whose CURRENT week is the bridge: one 3-week block already elapsed.
  await seed({
    settings: {
      currentPhaseId: 'gm',
      plan: {
        startDate: plusDays(MONDAY, -21),
        blocks: [
          { protocolId: 'gm', weeks: 3 },
          { protocolId: 'bridge', weeks: 1 },
        ],
      },
    },
  })
  await page.goto('/program')
  await expect(page.getByText('Bridge Week', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Grey Man — Day A')).toHaveCount(0)
})

test('the maxes screen offers the S exercises you actually built', async ({ page, seed }) => {
  await seed({
    settings: {
      currentPhaseId: 'gm',
      plan: { startDate: MONDAY, blocks: [{ protocolId: 'gm', weeks: 3 }] },
      mass: {
        sCluster: {
          s1: [{ id: 's_curl', name: 'Barbell Curl', defaultLoading: 'barbell' }],
          s2: [{ id: 's_calf', name: 'Calf Raise', defaultLoading: 'dumbbell' }],
        },
      },
    },
  })
  await page.goto('/maxes')
  // A custom S exercise used to be un-loadable: the session asked for a 1RM that
  // there was nowhere to enter, because /maxes rendered the book's defaults.
  await expect(page.getByLabel('Barbell Curl test weight')).toBeVisible()
  await expect(page.getByLabel('Calf Raise test weight')).toBeVisible()
  await expect(page.getByText('Dips', { exact: true })).toHaveCount(0)
})

test('the maxes preview uses the S percentages for an S lift', async ({ page, seed }) => {
  await seed({
    settings: {
      currentPhaseId: 'gm',
      plan: { startDate: MONDAY, blocks: [{ protocolId: 'gm', weeks: 3 }] },
      mass: {
        sCluster: {
          s1: [{ id: 's_curl', name: 'Barbell Curl', defaultLoading: 'barbell' }],
          s2: [],
        },
      },
    },
  })
  await page.goto('/maxes')
  await page.getByLabel('Barbell Curl test weight').fill('40')
  // A main lift too, so both rows of the grid are on screen at once.
  await page.getByLabel('Bench Press test weight', { exact: true }).fill('80')

  // S runs 55/60/65 (p.51), NOT the main lifts' 70/75/80 — which is what the
  // preview hardcoded for everything.
  await expect(page.getByText('Wk 1 · 55%')).toBeVisible()
  await expect(page.getByText('Wk 1 · 70%')).toBeVisible()
})
