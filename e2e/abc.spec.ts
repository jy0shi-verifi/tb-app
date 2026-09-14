import { test, expect, seedState, readSettings, mondayOffset, plusDays, confirmDialog } from './helpers'

const ABC_WEIGHTS = { abc_split: 8, abc_bench: 10, abc_row: 10, abc_ohp: 6, abc_lat: 5, abc_curl: 8 }

const abcSettings = (mon: string) => ({
  currentPhaseId: 'abc',
  programMode: 'abc',
  phaseStartDate: mon,
  abc: { lifts: ABC_WEIGHTS },
})

test('A/B/C lands Day A on Mon, Day B on Wed, Day C on Fri', async ({ page }) => {
  const mon = mondayOffset(0) // this Monday = A/B/C week 1, day 0 = Day A
  await seedState(page, { settings: abcSettings(mon) })

  await page.goto(`/session/${mon}`)
  await expect(page.getByRole('heading', { name: 'Strength — Day A' })).toBeVisible()
  await expect(page.getByText('Bulgarian Split Squat').first()).toBeVisible()
  await expect(page.getByText('DB Overhead Press').first()).toBeVisible()

  await page.goto(`/session/${plusDays(mon, 2)}`) // Wed = Day B
  await expect(page.getByRole('heading', { name: 'Strength — Day B' })).toBeVisible()
  await expect(page.getByText('DB Lateral Raise').first()).toBeVisible()

  await page.goto(`/session/${plusDays(mon, 4)}`) // Fri = Day C
  await expect(page.getByRole('heading', { name: 'Strength — Day C' })).toBeVisible()
  await expect(page.getByText('DB Curl').first()).toBeVisible()
})

test('A/B/C lift day shows "Last time" reps and the +2 kg progress chip', async ({ page }) => {
  const mon = mondayOffset(0) // Day A: split / bench / row / OHP
  const prior = plusDays(mon, -7)
  await seedState(page, {
    settings: abcSettings(mon),
    sessions: [
      {
        date: prior,
        phaseId: 'abc',
        week: 1,
        day: 0,
        type: 'lift',
        title: 'Strength — Day A',
        done: true,
        createdAt: 1,
        exercises: [
          { name: 'Bulgarian Split Squat', sets: [{ weight: 8, reps: 8, done: true }, { weight: 8, reps: 8, done: true }, { weight: 8, reps: 8, done: true }] },
          { name: 'DB Bench Press', sets: [{ weight: 10, reps: 8, done: true }, { weight: 10, reps: 8, done: true }, { weight: 10, reps: 8, done: true }] },
          { name: '1-Arm DB Row', sets: [{ weight: 10, reps: 8, done: true }, { weight: 10, reps: 8, done: true }, { weight: 10, reps: 8, done: true }] },
          { name: 'DB Overhead Press', sets: [{ weight: 6, reps: 8, done: true }, { weight: 6, reps: 8, done: true }, { weight: 6, reps: 8, done: true }] },
        ],
      },
    ],
  })

  await page.goto(`/session/${mon}`)
  await expect(page.getByText(/Last time:/).first()).toBeVisible()
  await expect(page.getByText(/\+2 kg/).first()).toBeVisible()
})

test('lateral raise carries its own 12–15 rep range', async ({ page }) => {
  const mon = mondayOffset(0)
  await seedState(page, { settings: abcSettings(mon) })

  await page.goto(`/session/${plusDays(mon, 2)}`) // Wed = Day B (has lateral raise)
  await expect(page.getByRole('heading', { name: 'Strength — Day B' })).toBeVisible()
  await expect(page.getByText(/12.15 reps/).first()).toBeVisible() // "aim 12–15 reps"
})

test('A/B/C off-day is a Runna-owned run slot (no interval timer)', async ({ page }) => {
  const mon = mondayOffset(0)
  const tue = plusDays(mon, 1) // day 1 = a run day
  await seedState(page, { settings: abcSettings(mon) })

  await page.goto(`/session/${tue}`)
  await expect(page.getByRole('heading', { name: 'Run' })).toBeVisible()
  await expect(page.getByText(/Runna/i)).toBeVisible()
  await expect(page.getByText(/JOG|WALK/)).toHaveCount(0)
})

test('switching to A/B/C carries over recent weights for shared lifts', async ({ page }) => {
  const mon = mondayOffset(0)
  // Start on Tactical Barbell with a recent lift log using the shared movements at
  // heavier-than-default weights (bench/row/OHP). Split squat / lateral / curl are new.
  await seedState(page, {
    settings: { currentPhaseId: 'operator', programMode: 'tb', phaseStartDate: mon },
    sessions: [
      {
        date: plusDays(mon, -3),
        phaseId: 'operator',
        week: 1,
        day: 0,
        type: 'lift',
        title: 'Operator',
        done: true,
        createdAt: 1,
        exercises: [
          { name: 'DB Bench Press', sets: [{ weight: 26, reps: 6, done: true }, { weight: 26, reps: 6, done: true }] },
          { name: '1-Arm DB Row', sets: [{ weight: 22, reps: 8, done: true }] },
          { name: 'DB Overhead Press', sets: [{ weight: 16, reps: 8, done: true }] },
        ],
      },
    ],
  })

  await page.goto('/settings')
  await page.getByRole('button', { name: /Switch to Dumbbell A\/B\/C/ }).click()
  await confirmDialog(page, 'Switch')
  await expect(page.getByText(/starting from your recent weights/i)).toBeVisible()

  const saved = await readSettings(page)
  const lifts = (saved?.abc as { lifts: Record<string, number> }).lifts
  // 26×6 / 22×8 / 16×8 Operator sets are converted to a ~10-rep A/B/C start
  expect(lifts.abc_bench).toBe(22)
  expect(lifts.abc_row).toBe(20)
  expect(lifts.abc_ohp).toBe(14)
  expect(lifts.abc_split).toBe(8) // no history → light default
  expect(lifts.abc_lat).toBe(5)
  expect(lifts.abc_curl).toBe(8)
})

test('History shows the A/B/C progress view (start → current per lift)', async ({ page }) => {
  const mon = mondayOffset(0)
  await seedState(page, {
    settings: { ...abcSettings(mon), abc: { lifts: { ...ABC_WEIGHTS, abc_bench: 14 } } },
    sessions: [
      {
        date: plusDays(mon, -7),
        phaseId: 'abc',
        week: 1,
        day: 0,
        type: 'lift',
        title: 'Strength — Day A',
        done: true,
        createdAt: 1,
        exercises: [{ name: 'DB Bench Press', sets: [{ weight: 10, reps: 12, done: true }] }],
      },
    ],
  })

  await page.goto('/history')
  await expect(page.getByText('Your lifts', { exact: true })).toBeVisible()
  await expect(page.getByText('DB Bench Press').first()).toBeVisible()
  await expect(page.getByText(/14 kg/).first()).toBeVisible()
})
