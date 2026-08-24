import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db, deleteSession, parseBackup, saveSettings, sessionForDate, DEFAULT_SETTINGS } from '../src/db'
import { loadBar } from '../src/lib/barbell'
import type { SessionLog } from '../src/types'

/**
 * The data-safety invariants — audit A6, code-01 F6, code-01 F8, code-02 F9.
 *
 * "Data loss is the highest-severity failure mode in this project" (CLAUDE.md),
 * so these run against a real IndexedDB rather than mocking it away.
 */

const session = (over: Partial<SessionLog> = {}): SessionLog => ({
  date: '2026-08-17',
  phaseId: 'gm',
  week: 1,
  day: 0,
  type: 'lift',
  title: 'Grey Man — Day A',
  exercises: [{ name: 'Bench Press', sets: [{ weight: 70, reps: 8, done: true }] }],
  done: true,
  createdAt: 1,
  ...over,
})

beforeEach(async () => {
  await db.transaction('rw', db.settings, db.sessions, async () => {
    await db.settings.clear()
    await db.sessions.clear()
    await db.settings.put({ ...DEFAULT_SETTINGS })
  })
})

// ---------------------------------------------------------------------------

describe('deleteSession holds the Strava invariant (audit code-01 F6)', () => {
  it('deletes a hand-logged row', async () => {
    const id = await db.sessions.add(session())
    expect(await deleteSession(id)).toBe('deleted')
    expect(await db.sessions.count()).toBe(0)
  })

  it('UN-TICKS a Strava-linked row instead of deleting it', async () => {
    // Deleting one only makes it come back on the next sync — the invariant used
    // to live only in Today.tsx, so Session and History deleted unconditionally.
    const id = await db.sessions.add(session({ stravaId: 12345 }))
    expect(await deleteSession(id)).toBe('unticked')
    expect(await db.sessions.count()).toBe(1)
    const row = await db.sessions.get(id)
    expect(row!.done).toBe(false)
    // And emphatically still linked, so the sync recognises it.
    expect(row!.stravaId).toBe(12345)
  })

  it('reports a row that is already gone rather than throwing', async () => {
    expect(await deleteSession(9999)).toBe('missing')
  })
})

describe('sessionForDate collapses duplicate rows (audit A6)', () => {
  it('returns the only row untouched when there is one', async () => {
    await db.sessions.add(session())
    const got = await sessionForDate('2026-08-17')
    expect(got!.date).toBe('2026-08-17')
    expect(await db.sessions.count()).toBe(1)
  })

  it('keeps the richer row and deletes the rest', async () => {
    await db.sessions.add(session({ exercises: [] , done: false }))
    await db.sessions.add(
      session({
        exercises: [
          { name: 'Bench Press', sets: [{ reps: 8, done: true }, { reps: 8, done: true }] },
        ],
      }),
    )
    const got = await sessionForDate('2026-08-17')
    expect(await db.sessions.count()).toBe(1)
    expect(got!.exercises[0].sets).toHaveLength(2)
  })

  it('never loses the Strava link, even when it is on the poorer row', async () => {
    // This is the exact failure A6 describes: `.first()` returns the LOWEST id,
    // while stravaSync's byDate map keeps the LAST — so enrichment landed on the
    // row the UI could not see.
    await db.sessions.add(
      session({
        exercises: [
          { name: 'Bench Press', sets: [{ reps: 8, done: true }, { reps: 8, done: true }] },
        ],
      }),
    )
    await db.sessions.add(session({ exercises: [], stravaId: 999, avgHr: 142, durationMin: 47 }))

    const got = await sessionForDate('2026-08-17')
    expect(await db.sessions.count()).toBe(1)
    expect(got!.stravaId).toBe(999)
    expect(got!.avgHr).toBe(142)
    // ...and the logged sets survived too.
    expect(got!.exercises[0].sets).toHaveLength(2)
  })

  it('prefers the Strava-linked row outright', async () => {
    await db.sessions.add(session({ exercises: [], stravaId: 7 }))
    await db.sessions.add(session({ exercises: [] }))
    const got = await sessionForDate('2026-08-17')
    expect(got!.stravaId).toBe(7)
    expect(await db.sessions.count()).toBe(1)
  })

  it('leaves other dates alone', async () => {
    await db.sessions.add(session())
    await db.sessions.add(session())
    await db.sessions.add(session({ date: '2026-08-19' }))
    await sessionForDate('2026-08-17')
    expect(await db.sessions.count()).toBe(2)
    expect(await db.sessions.where('date').equals('2026-08-19').count()).toBe(1)
  })
})

describe('saveSettings is transactional (audit code-01 F8)', () => {
  it('does not lose a concurrent write', async () => {
    // The scenario: Strava's background token refresh rotates the refresh token
    // while a settings screen saves a theme from stale render state. As a bare
    // read-modify-write, one of them wins and the other is silently reverted.
    await Promise.all([
      saveSettings({ strava: { accessToken: 'a', refreshToken: 'ROTATED', expiresAt: 1 } }),
      saveSettings({ theme: 'dark' }),
    ])
    const s = await db.settings.get('app')
    expect(s!.theme).toBe('dark')
    expect(s!.strava?.refreshToken).toBe('ROTATED')
  })

  it('survives a burst of writes without dropping any of them', async () => {
    await Promise.all([
      saveSettings({ theme: 'dark' }),
      saveSettings({ bodyweightKg: 82 }),
      saveSettings({ restSec: 180 }),
      saveSettings({ dbIncrement: 1 }),
    ])
    const s = await db.settings.get('app')
    expect(s!.bodyweightKg).toBe(82)
    expect(s!.restSec).toBe(180)
    expect(s!.dbIncrement).toBe(1)
  })
})

describe('the plate line agrees with the bar (audit code-02 F9)', () => {
  const inv = (kgs: number[]) => ({ barKg: 20, plates: kgs.map((kg) => ({ kg })) })

  it('reports what the plates actually weigh, off-grid sizes included', () => {
    // 1.1 kg plates are off the solver's 0.25 kg grid, so it snapped them to 1.0
    // and the app claimed 22 kg for a bar that weighed 22.2.
    const bar = loadBar(22, inv([1.1]))
    const perSideKg = bar.perSide.reduce((n, p) => n + p.kg * p.count, 0)
    expect(bar.totalKg).toBeCloseTo(20 + perSideKg * 2, 5)
  })

  it('is unchanged for a normal kg inventory', () => {
    const bar = loadBar(100, inv([25, 20, 15, 10, 5, 2.5, 1.25]))
    expect(bar.totalKg).toBe(100)
    const perSideKg = bar.perSide.reduce((n, p) => n + p.kg * p.count, 0)
    expect(bar.totalKg).toBe(20 + perSideKg * 2)
  })

  it('still reports an empty bar as the bar', () => {
    const bar = loadBar(20, inv([25, 20]))
    expect(bar.totalKg).toBe(20)
    expect(bar.perSide).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// The backup version gate — audit code-01 F11.
// ---------------------------------------------------------------------------

describe('parseBackup refuses a version it cannot read', () => {
  const file = (version: unknown) =>
    JSON.stringify({
      app: 'tb-app',
      version,
      exportedAt: '2026-08-24T00:00:00.000Z',
      settings: [{ id: 'app', dbIncrement: 2, currentPhaseId: 'gm', phaseStartDate: '2026-08-17' }],
      maxes: [],
      sessions: [],
      oneRm: [],
    })

  it('accepts the versions this build understands', () => {
    expect(parseBackup(file(1)).version).toBe(1)
    expect(parseBackup(file(2)).version).toBe(2)
  })

  it('refuses a newer version', () => {
    expect(() => parseBackup(file(3))).toThrow(/newer app version/)
  })

  it('REFUSES a version that is not a number, rather than skipping the gate', () => {
    // The gate was `typeof data.version === 'number' && data.version > MAX`, so
    // a string slipped straight past it and a future schema would have been
    // imported as if it were current.
    expect(() => parseBackup(file('3'))).toThrow(/readable version/)
    expect(() => parseBackup(file(null))).toThrow(/readable version/)
    expect(() => parseBackup(file({ major: 3 }))).toThrow(/readable version/)
  })

  it('still accepts a file with no version field at all — that is a v1 file', () => {
    const noVersion = JSON.parse(file(1))
    delete noVersion.version
    expect(() => parseBackup(JSON.stringify(noVersion))).not.toThrow()
  })
})
