import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { parseBackup, BACKUP_VERSION } from '../src/db'

// Backup portability is the migration contract between the live app and the
// rebuild (CLAUDE.md). These are the pure shape checks; test/migration.test.ts
// covers the actual Dexie upgrade and a real round-trip through IndexedDB.

const V1 = readFileSync('test/fixtures/backup-v1.json', 'utf-8')

const v2Payload = (over: Record<string, unknown> = {}) =>
  JSON.stringify({
    app: 'tb-app',
    version: 2,
    exportedAt: '2026-08-22T08:00:00.000Z',
    settings: [{ id: 'app', dbIncrement: 2, currentPhaseId: 'beginner', phaseStartDate: '2026-08-17' }],
    maxes: [],
    sessions: [],
    oneRm: [],
    ...over,
  })

describe('BACKUP_VERSION', () => {
  it('is 2 — v1 gained the oneRm table', () => {
    expect(BACKUP_VERSION).toBe(2)
  })
})

describe('parseBackup — v1 files must keep loading', () => {
  it('accepts the v1 fixture and fills in the table it predates', () => {
    const b = parseBackup(V1)
    expect(b.version).toBe(1)
    expect(b.sessions).toHaveLength(23)
    expect(b.oneRm).toEqual([])
  })

  it('does not reinterpret anything else in a v1 file', () => {
    const raw = JSON.parse(V1)
    const b = parseBackup(V1)
    expect(b.settings).toEqual(raw.settings)
    expect(b.sessions).toEqual(raw.sessions)
    expect(b.maxes).toEqual(raw.maxes)
  })

  it('keeps settings keys that the app no longer uses', () => {
    // The stored row still carries loadBasis and programMode from before the
    // Tactical Barbell strip. Round-tripping them is the point — dropping keys
    // silently loses data.
    const s = parseBackup(V1).settings[0] as Record<string, unknown>
    expect(s).toHaveProperty('loadBasis')
    expect(s).toHaveProperty('programMode')
  })
})

describe('parseBackup — v2', () => {
  it('accepts a v2 file and keeps its oneRm rows', () => {
    const json = v2Payload({
      oneRm: [
        {
          protocolId: 'gm',
          exerciseId: 'squat',
          exerciseName: 'Squat',
          kg: 100,
          unit: 'total',
          source: 'estimated',
          testedAt: '2026-08-22',
          progressedKg: 0,
        },
      ],
    })
    const b = parseBackup(json)
    expect(b.oneRm).toHaveLength(1)
    expect(b.oneRm[0].protocolId).toBe('gm')
  })
})

describe('parseBackup — rejections', () => {
  it('refuses a version newer than this app understands', () => {
    expect(() => parseBackup(v2Payload({ version: 3 }))).toThrow(/newer app version/)
  })

  it('refuses a file that is not a TB backup', () => {
    expect(() => parseBackup(JSON.stringify({ app: 'something-else' }))).toThrow(/Not a Tactical Barbell/)
  })

  it('refuses invalid JSON', () => {
    expect(() => parseBackup('{ nope')).toThrow(/valid JSON/)
  })

  it('refuses a truncated file missing a core table', () => {
    expect(() => parseBackup(v2Payload({ sessions: undefined }))).toThrow(/missing its data tables/)
  })

  it('refuses a file with no app settings row', () => {
    expect(() => parseBackup(v2Payload({ settings: [] }))).toThrow(/no app settings row/)
  })

  it('treats a malformed oneRm as corruption, not as an old file', () => {
    // Absent => v1, fill with []. Present but wrong type => corrupt, reject.
    expect(() => parseBackup(v2Payload({ oneRm: 'nope' }))).toThrow(/1RM table is malformed/)
    expect(() => parseBackup(v2Payload({ oneRm: 42 }))).toThrow(/1RM table is malformed/)
  })

  it('does not mistake an explicit empty oneRm for a missing one', () => {
    expect(parseBackup(v2Payload({ oneRm: [] })).oneRm).toEqual([])
  })
})
