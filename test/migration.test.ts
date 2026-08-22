import 'fake-indexeddb/auto'
import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import Dexie from 'dexie'

/**
 * The Dexie v1 → v2 upgrade.
 *
 * "Data loss is the highest-severity failure mode in this project" (CLAUDE.md),
 * and this is the first schema migration the app has ever had. So the test does
 * the real thing: builds a genuine v1 IndexedDB with the v1 schema, fills it,
 * closes it, then opens the app's actual TBDatabase over the top and checks that
 * every row survived and that the new store exists and is empty.
 *
 * The fixture mirrors Josh's real 23-session backup exactly in shape — same
 * keys, same session count, same exercise names — with synthetic numbers,
 * because the real file is personal data and stays gitignored. The real file IS
 * exercised too, in the last block, whenever it happens to be present.
 */

const V1_JSON = readFileSync('test/fixtures/backup-v1.json', 'utf-8')
const v1 = JSON.parse(V1_JSON) as {
  settings: Record<string, unknown>[]
  maxes: Record<string, unknown>[]
  sessions: Record<string, unknown>[]
}

/** Build a real v1 database, exactly as the shipped v1 app would have left it. */
async function seedV1Database(): Promise<void> {
  const legacy = new Dexie('tb-app')
  legacy.version(1).stores({
    settings: 'id',
    maxes: 'liftId',
    sessions: '++id, date, phaseId',
  })
  await legacy.open()
  expect(legacy.verno).toBe(1)
  await legacy.table('settings').bulkPut(v1.settings)
  await legacy.table('sessions').bulkPut(v1.sessions)
  legacy.close()
}

// Imported only after the v1 database exists, so opening it performs the upgrade.
type DbModule = typeof import('../src/db')
let mod: DbModule

beforeAll(async () => {
  await seedV1Database()
  mod = await import('../src/db')
  await mod.db.open()
})

describe('Dexie v1 → v2 upgrade', () => {
  it('lands on version 2', () => {
    expect(mod.db.verno).toBe(2)
  })

  it('adds the oneRm store, empty', async () => {
    expect(await mod.db.oneRm.count()).toBe(0)
  })

  it('keeps every session, byte for byte', async () => {
    const rows = await mod.db.sessions.orderBy('id').toArray()
    expect(rows).toHaveLength(23)
    expect(rows).toEqual(v1.sessions)
  })

  it('keeps the settings row intact, including keys the app no longer reads', async () => {
    const s = (await mod.db.settings.get('app')) as Record<string, unknown>
    expect(s).toEqual(v1.settings[0])
    expect(s).toHaveProperty('loadBasis')
    expect(s).toHaveProperty('programMode')
  })

  it('leaves the frozen maxes store usable for round-tripping', async () => {
    expect(await mod.db.maxes.count()).toBe(0)
    await mod.db.maxes.put({ liftId: 'legacy_bench', testWeight: 24, testReps: 5 })
    expect(await mod.db.maxes.get('legacy_bench')).toMatchObject({ testWeight: 24 })
    await mod.db.maxes.clear()
  })

  it('still resolves sessions through the date and phaseId indexes', async () => {
    const byPhase = await mod.db.sessions.where('phaseId').equals('beginner').count()
    expect(byPhase).toBe(23)
    const first = await mod.db.sessions.where('date').equals('2026-07-28').toArray()
    expect(first.length).toBeGreaterThan(0)
  })
})

describe('export / import round trip after the upgrade', () => {
  it('exports at version 2 with an oneRm array', async () => {
    const b = JSON.parse(await mod.exportBackup())
    expect(b.version).toBe(2)
    expect(b.oneRm).toEqual([])
    expect(b.sessions).toHaveLength(23)
  })

  it('never writes Strava tokens into an export', async () => {
    const s = (await mod.db.settings.get('app'))!
    await mod.db.settings.put({
      ...s,
      strava: { accessToken: 'secret', refreshToken: 'secret', expiresAt: 1 },
    })
    const b = JSON.parse(await mod.exportBackup())
    expect(b.settings[0].strava).toBeUndefined()
    expect(await mod.exportBackup()).not.toContain('secret')
    await mod.db.settings.put(s)
  })

  it('imports the v1 fixture into the v2 schema without losing a session', async () => {
    await mod.importBackup(V1_JSON)
    expect(await mod.db.sessions.count()).toBe(23)
    expect(await mod.db.oneRm.count()).toBe(0)
    const rows = await mod.db.sessions.orderBy('id').toArray()
    expect(rows).toEqual(v1.sessions)
  })

  it('round-trips oneRm rows through export and back', async () => {
    await mod.db.oneRm.bulkPut([
      {
        protocolId: 'gm',
        exerciseId: 'squat',
        exerciseName: 'Squat',
        kg: 100,
        unit: 'total',
        source: 'estimated',
        testedAt: '2026-08-22',
        progressedKg: 2.5,
      },
      {
        protocolId: 'beginner',
        exerciseId: 'db_bench',
        exerciseName: 'DB Bench Press',
        kg: 24,
        unit: 'perDumbbell',
        source: 'tested',
        testedAt: '2026-08-01',
        progressedKg: 0,
      },
    ])
    const exported = await mod.exportBackup()
    await mod.db.oneRm.clear()
    expect(await mod.db.oneRm.count()).toBe(0)

    await mod.importBackup(exported)
    const back = await mod.db.oneRm.toArray()
    expect(back).toHaveLength(2)
    // The compound key is what keeps the two protocols' maxes apart.
    expect(await mod.db.oneRm.get(['gm', 'squat'])).toMatchObject({ kg: 100, progressedKg: 2.5 })
    expect(await mod.db.oneRm.get(['beginner', 'db_bench'])).toMatchObject({ unit: 'perDumbbell' })
  })

  it('scopes maxes by protocol — the same exercise id under two protocols does not collide', async () => {
    // The live collision CLAUDE.md warns about: 'DB Bench Press' exists in both
    // the logged beginner history and any S cluster that reuses the name.
    await mod.db.oneRm.put({
      protocolId: 'gm',
      exerciseId: 'db_bench',
      exerciseName: 'DB Bench Press',
      kg: 30,
      unit: 'perDumbbell',
      source: 'tested',
      testedAt: '2026-08-22',
      progressedKg: 0,
    })
    expect((await mod.db.oneRm.get(['beginner', 'db_bench']))?.kg).toBe(24)
    expect((await mod.db.oneRm.get(['gm', 'db_bench']))?.kg).toBe(30)
    await mod.db.oneRm.clear()
  })

  it('is stable across a second export/import cycle', async () => {
    const once = JSON.parse(await mod.exportBackup())
    await mod.importBackup(JSON.stringify(once))
    const twice = JSON.parse(await mod.exportBackup())
    expect(twice.sessions).toEqual(once.sessions)
    expect(twice.settings).toEqual(once.settings)
    expect(twice.oneRm).toEqual(once.oneRm)
  })
})

// ---------------------------------------------------------------------------
// The real backup, when it is on this machine. Gitignored personal data, so it
// cannot be the committed fixture — but if it is here, it gets tested.
// ---------------------------------------------------------------------------
const realBackup = (): string | null => {
  if (!existsSync('backups')) return null
  const f = readdirSync('backups')
    .filter((n) => n.endsWith('.json'))
    .sort()
    .pop()
  return f ? readFileSync(`backups/${f}`, 'utf-8') : null
}

describe('the real 23-session backup', () => {
  const json = realBackup()

  it.runIf(json)('imports into the v2 schema with every session intact', async () => {
    const parsed = JSON.parse(json!)
    await mod.importBackup(json!)
    expect(await mod.db.sessions.count()).toBe(parsed.sessions.length)
    const rows = await mod.db.sessions.orderBy('id').toArray()
    expect(rows).toEqual(parsed.sessions)
    // Re-exporting must not mutate the history on the way through.
    const out = JSON.parse(await mod.exportBackup())
    expect(out.sessions).toEqual(parsed.sessions)
    expect(out.version).toBe(2)
  })

  it.skipIf(json)('is absent on this machine — synthetic fixture covered it instead', () => {
    expect(json).toBeNull()
  })
})
