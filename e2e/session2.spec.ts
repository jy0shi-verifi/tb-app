import {
  test,
  expect,
  setupOperator,
  seedState,
  readSessions,
  mondayOffset,
  plusDays,
  OP_MAXES,
} from './helpers'

test('in-progress lift logging survives a full reload', async ({ page }) => {
  const mon = await setupOperator(page)
  await page.goto(`/session/${mon}`)
  await page.getByLabel('Weight per dumbbell').first().fill('23')
  await page.getByLabel('Mark set done').first().click()
  await page.reload()
  await expect(page.getByLabel('Weight per dumbbell').first()).toHaveValue('23')
})

test('a partial session shows "you showed up" and is not marked fully done', async ({ page }) => {
  const mon = await setupOperator(page)
  await page.goto(`/session/${mon}`)
  await page.getByLabel('Mark set done').first().click()
  await expect(page.getByText(/you showed up/i)).toBeVisible()
  const rows = await readSessions(page)
  expect(rows.find((r) => r.date === mon)?.done).toBe(false)
})

test('autosave does not clobber Strava enrichment on a lift day', async ({ page }) => {
  const mon = mondayOffset(0)
  await seedState(page, {
    settings: {
      currentPhaseId: 'operator',
      phaseStartDate: mon,
      operatorBlock: 1,
      operatorFirstRunDone: true,
    },
    maxes: OP_MAXES,
    sessions: [
      {
        date: mon,
        phaseId: 'operator',
        week: 1,
        day: 0,
        type: 'lift',
        title: 'Operator · Wk1 · Lift 1',
        exercises: [],
        done: false,
        durationMin: 45,
        avgHr: 141,
        stravaId: 99887766,
        createdAt: 1,
      },
    ],
  })
  await page.goto(`/session/${mon}`)
  await page.getByLabel('Mark set done').first().click()
  await page.waitForTimeout(400) // let autosave flush
  const row = (await readSessions(page)).find((r) => r.date === mon)
  expect(row?.stravaId).toBe(99887766)
  expect(row?.durationMin).toBe(45)
  expect(row?.avgHr).toBe(141)
})

test('SE circuit rests only when a whole round completes', async ({ page }) => {
  const mon = mondayOffset(0)
  await seedState(page, { settings: { currentPhaseId: 'base-building', phaseStartDate: mon } })
  await page.goto(`/session/${mon}`)
  const done = page.getByLabel('Mark done')
  await expect(done.first()).toBeVisible()
  await done.nth(0).click()
  await expect(page.getByLabel('Skip rest')).toBeHidden() // one move — round not done
  for (let i = 1; i < 6; i++) await done.nth(i).click() // finish round 1 (6 moves)
  await expect(page.getByLabel('Skip rest')).toBeVisible()
})

test('a future session is preview-only (no logging)', async ({ page }) => {
  const mon = mondayOffset(0)
  const nextMon = mondayOffset(1) // always in the future
  await seedState(page, {
    settings: {
      currentPhaseId: 'operator',
      phaseStartDate: mon,
      operatorBlock: 1,
      operatorFirstRunDone: true,
    },
    maxes: OP_MAXES,
  })
  await page.goto(`/session/${nextMon}`)
  await expect(page.getByText('Preview')).toBeVisible()
  await page.getByLabel('Mark set done').first().click()
  await page.waitForTimeout(400)
  const rows = await readSessions(page)
  expect(rows.find((r) => r.date === nextMon)).toBeUndefined()
})

test('un-ticking a Strava-imported run keeps it complete', async ({ page }) => {
  const mon = mondayOffset(0)
  const tue = plusDays(mon, 1) // Operator Tue = HIC
  await seedState(page, {
    settings: {
      currentPhaseId: 'operator',
      phaseStartDate: mon,
      operatorBlock: 1,
      operatorFirstRunDone: true,
    },
    maxes: OP_MAXES,
    sessions: [
      {
        date: tue,
        phaseId: 'operator',
        week: 1,
        day: 1,
        type: 'hic',
        title: 'Morning Run',
        exercises: [],
        done: true,
        durationMin: 32,
        distanceKm: 5.1,
        stravaId: 4242,
        createdAt: 1,
      },
    ],
  })
  await page.goto(`/session/${tue}`)
  await expect(page.getByText(/Completed · via Strava/)).toBeVisible()
  await page.getByText(/Completed · via Strava/).click()
  await page.waitForTimeout(400)
  const row = (await readSessions(page)).find((r) => r.date === tue)
  expect(row?.done).toBe(true)
  expect(row?.stravaId).toBe(4242)
})
