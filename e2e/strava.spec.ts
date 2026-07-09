import { test, expect, seedState, readSessions, mondayOffset, plusDays, OP_MAXES } from './helpers'

const FAR_FUTURE = 4102444800 // epoch seconds ~year 2100 (token still valid)

function stravaSettings(extra: Record<string, unknown> = {}) {
  return {
    currentPhaseId: 'operator',
    phaseStartDate: mondayOffset(0),
    operatorBlock: 2,
    operatorFirstRunDone: true,
    strava: {
      accessToken: 'tok',
      refreshToken: 'ref',
      expiresAt: FAR_FUTURE,
      scope: 'activity:read_all,activity:write',
    },
    ...extra,
  }
}

test('a Strava run auto-ticks the matching run day on open', async ({ page }) => {
  const runDay = plusDays(mondayOffset(0), 3) // Operator day 3 = easy run
  await page.route('**/api/strava/activities', (r) =>
    r.fulfill({
      json: [
        {
          id: 555,
          type: 'Run',
          start_date_local: `${runDay}T08:00:00Z`,
          moving_time: 1800,
          distance: 5000,
          average_heartrate: 140,
        },
      ],
    }),
  )
  await page.route('**/api/strava/update', (r) => r.fulfill({ json: {} }))

  await seedState(page, { settings: stravaSettings(), maxes: OP_MAXES })

  await expect
    .poll(async () => (await readSessions(page)).some((s) => s.stravaId === 555 && s.done === true))
    .toBe(true)
})

test('a logged lift gets its set breakdown written back to Strava', async ({ page }) => {
  const mon = mondayOffset(0)
  let updateBody: { name?: string; description?: string } | null = null
  await page.route('**/api/strava/activities', (r) =>
    r.fulfill({
      json: [{ id: 777, type: 'WeightTraining', start_date_local: `${mon}T06:00:00Z`, moving_time: 2700, distance: 0 }],
    }),
  )
  await page.route('**/api/strava/update', async (r) => {
    updateBody = r.request().postDataJSON()
    await r.fulfill({ json: {} })
  })

  await seedState(page, {
    settings: stravaSettings(),
    maxes: OP_MAXES,
    sessions: [
      {
        date: mon,
        phaseId: 'operator',
        week: 1,
        day: 0,
        type: 'lift',
        title: 'Operator lift',
        done: true,
        createdAt: 1,
        exercises: [
          {
            name: 'DB Bench Press',
            sets: [
              { weight: 18, reps: 5, done: true },
              { weight: 18, reps: 5, done: true },
            ],
          },
        ],
      },
    ],
  })

  await expect.poll(() => updateBody !== null).toBe(true)
  expect(updateBody!.name).toMatch(/Operator .* Lift 1/)
  expect(updateBody!.description).toMatch(/DB Bench Press/)
  expect(updateBody!.description).toMatch(/via Tactical Barbell/)
})

test('a Strava sync failure surfaces a "couldn\'t reach Strava" banner', async ({ page }) => {
  await page.route('**/api/strava/activities', (r) => r.fulfill({ status: 500, json: { error: 'boom' } }))
  await seedState(page, { settings: stravaSettings(), maxes: OP_MAXES })
  await expect(page.getByText(/Couldn.t reach Strava/i)).toBeVisible()
})

test('a revoked Strava token surfaces a reconnect banner', async ({ page }) => {
  await page.route('**/api/strava/token', (r) => r.fulfill({ status: 401, json: { error: 'invalid' } }))
  await seedState(page, {
    settings: stravaSettings({ strava: { accessToken: 'tok', refreshToken: 'ref', expiresAt: 100, scope: 'activity:read_all' } }),
    maxes: OP_MAXES,
  })
  await expect(page.getByText(/Strava needs reconnecting/i)).toBeVisible()
})
