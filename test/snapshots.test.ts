import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { db, exportBackup, importBackup } from '../src/db'
import {
  KEEP_GUARD,
  KEEP_ROUTINE,
  listSnapshots,
  restoreSnapshot,
  snapshotOnOpen,
  takeSnapshot,
} from '../src/lib/snapshots'
import type { SessionLog, Settings } from '../src/types'

/**
 * Automatic on-device backups (audit A5) and the import rollback they protect
 * (audit A11 — "the highest-value missing test in the repo").
 *
 * Data loss is the highest-severity failure mode in this project, so these
 * assert against a real IndexedDB rather than mocking the database away.
 */

const settings = (over: Partial<Settings> = {}): Settings => ({
  id: 'app',
  dbIncrement: 2,
  currentPhaseId: 'gm',
  phaseStartDate: '2026-08-17',
  ...over,
})

const session = (date: string): SessionLog => ({
  date,
  phaseId: 'gm',
  week: 1,
  day: 0,
  type: 'lift',
  title: 'Grey Man — Day A',
  exercises: [{ name: 'Bench Press', sets: [{ weight: 70, reps: 8, done: true }] }],
  done: true,
  createdAt: 1,
})

async function reset(sessions: string[] = ['2026-08-17', '2026-08-19']) {
  await db.transaction('rw', db.settings, db.maxes, db.sessions, db.oneRm, db.snapshots, async () => {
    await Promise.all([
      db.settings.clear(),
      db.maxes.clear(),
      db.sessions.clear(),
      db.oneRm.clear(),
      db.snapshots.clear(),
    ])
    await db.settings.put(settings())
    for (const d of sessions) await db.sessions.add(session(d))
  })
}

beforeEach(() => reset())
afterEach(() => vi.restoreAllMocks())

// ---------------------------------------------------------------------------

describe('taking a snapshot', () => {
  it('stores exactly what exportBackup produces, plus why it was taken', async () => {
    await takeSnapshot('pre-demo')
    const [snap] = await listSnapshots()
    expect(snap.reason).toBe('pre-demo')
    expect(snap.sessionCount).toBe(2)
    const parsed = JSON.parse(snap.json)
    expect(parsed.app).toBe('tb-app')
    expect(parsed.sessions).toHaveLength(2)
  })

  it('never throws — a backup must not break the thing it protects', async () => {
    vi.spyOn(db.sessions, 'count').mockRejectedValueOnce(new Error('boom'))
    await expect(takeSnapshot('app-open')).resolves.toBe(false)
  })

  it('does NOT put snapshots inside a backup file', async () => {
    // Otherwise every export would carry the previous ones and grow
    // geometrically — which is also why BACKUP_VERSION stays at 2.
    await takeSnapshot('app-open')
    const json = await exportBackup()
    expect(Object.keys(JSON.parse(json))).not.toContain('snapshots')
  })
})

describe('the snapshot store survives every destructive path — the whole point', () => {
  it('survives importBackup, which clears the other four tables', async () => {
    await takeSnapshot('pre-import')
    const empty = JSON.stringify({
      app: 'tb-app',
      version: 2,
      exportedAt: '2026-08-24T00:00:00.000Z',
      settings: [settings()],
      maxes: [],
      sessions: [],
      oneRm: [],
    })
    await importBackup(empty)

    expect(await db.sessions.count()).toBe(0)
    // The snapshot is still there — and still holds the two lost sessions.
    const snaps = await listSnapshots()
    expect(snaps).toHaveLength(1)
    expect(JSON.parse(snaps[0].json).sessions).toHaveLength(2)
  })

  it('restores from a snapshot, taking one of the current state first', async () => {
    await takeSnapshot('pre-demo')
    const [snap] = await listSnapshots()

    await db.sessions.clear() // the disaster
    expect(await db.sessions.count()).toBe(0)

    await restoreSnapshot(snap.id!)
    expect(await db.sessions.count()).toBe(2)

    // Restoring is itself undoable: a 'pre-restore' snapshot of the wiped state
    // now exists, so picking the wrong snapshot is not a one-way door.
    const after = await listSnapshots()
    expect(after.map((s) => s.reason)).toContain('pre-restore')
  })

  it('refuses a snapshot that is no longer there rather than clearing anything', async () => {
    await expect(restoreSnapshot(9999)).rejects.toThrow(/no longer/)
    expect(await db.sessions.count()).toBe(2)
  })
})

describe('retention', () => {
  it('keeps the last N routine snapshots and prunes older ones', async () => {
    for (let i = 0; i < KEEP_ROUTINE + 3; i++) await takeSnapshot('app-open')
    const snaps = await listSnapshots()
    expect(snaps).toHaveLength(KEEP_ROUTINE)
  })

  it('does NOT let routine snapshots evict the guard ones', async () => {
    // The reason retention is split by kind: a busy fortnight of app opens must
    // not push out the snapshot taken immediately before the demo button.
    await takeSnapshot('pre-demo')
    for (let i = 0; i < KEEP_ROUTINE + 5; i++) await takeSnapshot('app-open')
    const snaps = await listSnapshots()
    expect(snaps.some((s) => s.reason === 'pre-demo')).toBe(true)
    expect(snaps.filter((s) => s.reason === 'app-open')).toHaveLength(KEEP_ROUTINE)
  })

  it('caps guard snapshots too', async () => {
    for (let i = 0; i < KEEP_GUARD + 3; i++) await takeSnapshot('pre-reset')
    expect(await listSnapshots()).toHaveLength(KEEP_GUARD)
  })
})

describe('the app-open snapshot', () => {
  it('does nothing on a database with no training in it', async () => {
    await reset([])
    await snapshotOnOpen()
    expect(await listSnapshots()).toHaveLength(0)
  })

  it('takes one when there is training to lose', async () => {
    await snapshotOnOpen()
    expect(await listSnapshots()).toHaveLength(1)
  })

  it('throttles — opening the app twice in a morning writes one, not two', async () => {
    await snapshotOnOpen()
    await snapshotOnOpen()
    expect(await listSnapshots()).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// A11 — the import rollback branch. `importBackup` clears all four tables
// before writing, so if the restore is broken everything is lost silently.
// ---------------------------------------------------------------------------

describe('importBackup rollback (audit A11)', () => {
  const goodFile = (sessions: SessionLog[]) =>
    JSON.stringify({
      app: 'tb-app',
      version: 2,
      exportedAt: '2026-08-24T00:00:00.000Z',
      settings: [settings({ currentPhaseId: 'gm' })],
      maxes: [],
      sessions,
      oneRm: [],
    })

  it('keeps the existing data when the write fails partway', async () => {
    const before = await db.sessions.toArray()
    expect(before).toHaveLength(2)

    // Fail the session write only on the way IN; the rollback path calls
    // bulkPut again and must be allowed to succeed.
    vi.spyOn(db.sessions, 'bulkPut').mockRejectedValueOnce(new Error('disk full'))

    await expect(importBackup(goodFile([session('2030-01-01')]))).rejects.toThrow(
      /kept your existing data/,
    )

    const after = await db.sessions.toArray()
    expect(after.map((s) => s.date)).toEqual(before.map((s) => s.date))
    // And emphatically NOT the file we tried to import.
    expect(after.map((s) => s.date)).not.toContain('2030-01-01')
    expect(await db.settings.get('app')).toBeDefined()
  })

  it('leaves the snapshot store untouched by a failed import', async () => {
    await takeSnapshot('pre-import')
    vi.spyOn(db.sessions, 'bulkPut').mockRejectedValueOnce(new Error('disk full'))
    await expect(importBackup(goodFile([session('2030-01-01')]))).rejects.toThrow()
    expect(await listSnapshots()).toHaveLength(1)
  })

  it('validates before touching anything at all', async () => {
    await expect(importBackup('{"app":"not-tb"}')).rejects.toThrow(/Not a Tactical Barbell/)
    expect(await db.sessions.count()).toBe(2)
  })
})
