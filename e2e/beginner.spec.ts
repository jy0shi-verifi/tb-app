import { test, expect, seedState, mondayOffset, plusDays } from './helpers'

const BEGINNER_WEIGHTS = { bg_squat: 10, bg_bench: 8, bg_row: 8, bg_rdl: 10, bg_lunge: 8, bg_ohp: 6 }

test('beginner lift day shows "Last time" reps and the +2 kg progress chip', async ({ page }) => {
  const mon = mondayOffset(0) // this Monday = beginner week 1, day 0 = Day A (squat/bench/row)
  const prior = plusDays(mon, -7)
  await seedState(page, {
    settings: {
      currentPhaseId: 'beginner',
      programMode: 'beginner',
      phaseStartDate: mon,
      beginner: { lifts: BEGINNER_WEIGHTS },
    },
    sessions: [
      {
        date: prior,
        phaseId: 'beginner',
        week: 1,
        day: 0,
        type: 'lift',
        title: 'Strength — Day A',
        done: true,
        createdAt: 1,
        exercises: [
          { name: 'Goblet / Front-rack Squat', sets: [{ weight: 10, reps: 8, done: true }, { weight: 10, reps: 8, done: true }, { weight: 10, reps: 8, done: true }] },
          { name: 'DB Bench Press', sets: [{ weight: 8, reps: 8, done: true }, { weight: 8, reps: 8, done: true }, { weight: 8, reps: 8, done: true }] },
          { name: '1-Arm DB Row', sets: [{ weight: 8, reps: 8, done: true }, { weight: 8, reps: 8, done: true }, { weight: 8, reps: 8, done: true }] },
        ],
      },
    ],
  })

  await page.goto(`/session/${mon}`)
  await expect(page.getByText(/Last time:/).first()).toBeVisible()
  await expect(page.getByText(/\+2 kg/).first()).toBeVisible()
})

test('beginner run day is a plain Runna-owned slot (no C25K interval timer)', async ({ page }) => {
  const mon = mondayOffset(0)
  const tue = plusDays(mon, 1) // day 1 = a run day
  await seedState(page, {
    settings: {
      currentPhaseId: 'beginner',
      programMode: 'beginner',
      phaseStartDate: mon,
      beginner: { lifts: BEGINNER_WEIGHTS },
    },
  })

  await page.goto(`/session/${tue}`)
  await expect(page.getByRole('heading', { name: 'Run' })).toBeVisible()
  await expect(page.getByText(/Runna/i)).toBeVisible()
  await expect(page.getByText(/JOG|WALK/)).toHaveCount(0) // interval timer is gone
})

test('a stalled beginner lift shows a deload suggestion', async ({ page }) => {
  const mon = mondayOffset(0) // this Monday = Day A (includes Goblet Squat)
  const squat = (date: string, reps: number) => ({
    date,
    phaseId: 'beginner',
    week: 1,
    day: 0,
    type: 'lift',
    title: 'Strength — Day A',
    done: true,
    createdAt: 1,
    exercises: [{ name: 'Goblet / Front-rack Squat', sets: [{ weight: 10, reps, done: true }, { weight: 10, reps, done: true }, { weight: 10, reps, done: true }] }],
  })
  await seedState(page, {
    settings: { currentPhaseId: 'beginner', programMode: 'beginner', phaseStartDate: mon, beginner: { lifts: BEGINNER_WEIGHTS } },
    sessions: [squat(plusDays(mon, -14), 9), squat(plusDays(mon, -11), 9), squat(plusDays(mon, -7), 9)],
  })

  await page.goto(`/session/${mon}`)
  await expect(page.getByText(/Stalled/)).toBeVisible()
  await expect(page.getByRole('button', { name: /Deload to 8kg/ })).toBeVisible()
})

test('History shows the beginner progress view (start → current per lift)', async ({ page }) => {
  const mon = mondayOffset(0)
  await seedState(page, {
    settings: { currentPhaseId: 'beginner', programMode: 'beginner', phaseStartDate: mon, beginner: { lifts: { ...BEGINNER_WEIGHTS, bg_squat: 14 } } },
    sessions: [
      {
        date: plusDays(mon, -7),
        phaseId: 'beginner',
        week: 1,
        day: 0,
        type: 'lift',
        title: 'Strength — Day A',
        done: true,
        createdAt: 1,
        exercises: [{ name: 'Goblet / Front-rack Squat', sets: [{ weight: 10, reps: 12, done: true }] }],
      },
    ],
  })

  await page.goto('/history')
  await expect(page.getByText('Your lifts', { exact: true })).toBeVisible()
  await expect(page.getByText(/Goblet \/ Front-rack Squat/)).toBeVisible()
  await expect(page.getByText(/14 kg/).first()).toBeVisible()
  await expect(page.getByText(/\+4/).first()).toBeVisible()
})
