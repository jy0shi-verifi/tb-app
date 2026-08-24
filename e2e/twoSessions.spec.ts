import { test, expect, isoOffset, mondayOffset, readSessions } from './helpers'

/**
 * Two sessions in one day — backlog F1.
 *
 * Josh, 2026-08-24: *"Let's say it's a Tuesday, and I am supposed to do
 * conditioning in the morning & Wednesday is my next lifting day. Let's say that
 * on Wednesday I'm waking up early to travel to the other side of the country, I
 * would want to push the lifting on Wednesday forward to Tuesday so I'd: run in
 * the morning & lift in the night. Same thing goes in reverse... I cannot be
 * allowed to lift twice in one day."*
 *
 * These run through the real screens because the unit tests structurally cannot:
 * the interesting failures are a screen binding to the wrong row of the two.
 */

const MONDAY = mondayOffset(0)

test('logging a lift no longer destroys a Strava run on the same date', async ({ page, seed }) => {
  // audit code-01 F7. Before F1 this was REFUSED, visibly, because one row per
  // date could not hold both — the lift would have kept the run's stravaId and
  // distance while overwriting its type. Under MASS it is a normal week: Green
  // conditioning IS the running (p.99).
  await seed({
    settings: { currentPhaseId: 'beginner', phaseStartDate: MONDAY },
    sessions: [
      {
        date: MONDAY,
        phaseId: 'beginner',
        week: 1,
        day: 0,
        type: 'run',
        title: 'Runna — Easy 5k',
        exercises: [],
        done: true,
        stravaId: 555,
        distanceKm: 5.2,
        durationMin: 31,
        createdAt: 1,
      },
    ],
  })

  await page.goto(`/session/${MONDAY}`)
  await page.getByLabel('Weight per dumbbell').first().fill('20')
  await page.getByLabel('Mark set done').first().click()

  // The refusal banner belongs to the old one-row world and must not appear.
  await expect(page.getByRole('alert')).toBeHidden()

  await expect
    .poll(async () => (await readSessions(page)).filter((s) => s.date === MONDAY).length)
    .toBe(2)

  const rows = await readSessions(page)
  const run = rows.find((s) => s.type === 'run')!
  const lift = rows.find((s) => s.type === 'lift')!
  // The run is exactly as Strava left it.
  expect(run.stravaId).toBe(555)
  expect(run.distanceKm).toBe(5.2)
  expect(run.title).toBe('Runna — Easy 5k')
  // ...and the lift is its own row, with no borrowed Strava link.
  expect(lift.stravaId).toBeUndefined()
  expect((lift.exercises as { sets: unknown[] }[])[0].sets.length).toBeGreaterThan(0)
})

test('tomorrow’s lift can be brought forward onto a running day', async ({ page, seed }) => {
  // Day 1 of the phase is a Beginner run day; day 2 is the next lift day. Seeding
  // the start one day back makes TODAY day 1 whatever the real weekday is.
  await seed({ settings: { currentPhaseId: 'beginner', phaseStartDate: isoOffset(-1) } })

  const offer = page.getByRole('button', { name: /Short of time tomorrow/ })
  await expect(offer).toBeVisible()
  await offer.click()

  await expect(page.getByText(/Brought forward from/)).toBeVisible()

  const rows = await readSessions(page)
  const pulled = rows.find((s) => s.pulledFrom != null)!
  expect(pulled.date).toBe(isoOffset(0)) // trained today...
  expect(pulled.pulledFrom).toBe(isoOffset(1)) // ...on tomorrow's behalf
  expect(pulled.day).toBe(2) // and it keeps the slot it FULFILS, not today's
  expect(pulled.done).toBe(false) // scheduling it is not doing it
})

test('a day whose session was trained early shows as covered, not as work to do', async ({
  page,
  seed,
}) => {
  // Today is day 2 — a lift day — but yesterday's row already fulfilled it.
  await seed({
    settings: { currentPhaseId: 'beginner', phaseStartDate: isoOffset(-2) },
    sessions: [
      {
        date: isoOffset(-1),
        phaseId: 'beginner',
        week: 1,
        day: 2,
        type: 'lift',
        title: 'Day B',
        exercises: [],
        done: true,
        pulledFrom: isoOffset(0),
        createdAt: 1,
      },
    ],
  })

  await expect(page.getByText(/^Done on /)).toBeVisible()
  // And emphatically not an invitation to do it a second time.
  await expect(page.getByRole('button', { name: /^Start session$/ })).toBeHidden()
})

test('conditioning sharing a lifting day can be ticked off (p.99)', async ({ page, seed }) => {
  // Until F1 this was informational only — the Green session had nowhere of its
  // own to be completed, because the lift already owned the date's single row.
  await seed({
    settings: {
      currentPhaseId: 'gm',
      phaseStartDate: isoOffset(0), // today is day 0: a Grey Man lifting day
      mass: { conditioningDays: [0] },
    },
  })

  await expect(page.getByText(/Also today: Walk/)).toBeVisible()
  await page.getByLabel('Mark Walk done').click()

  await expect
    .poll(async () => (await readSessions(page)).filter((s) => s.type === 'run').length)
    .toBe(1)

  const rows = await readSessions(page)
  expect(rows.filter((s) => s.date === isoOffset(0))).toHaveLength(1)
  expect(rows[0].done).toBe(true)
  expect(rows[0].title).toBe('Walk')
})
