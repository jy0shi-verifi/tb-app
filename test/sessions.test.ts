import { describe, it, expect } from 'vitest'
import {
  coverFor,
  familyOf,
  mergeRows,
  pullForwardBlocker,
  pulledForwardDates,
  repairDate,
  rowOfFamily,
} from '../src/lib/sessions'
import type { SessionLog } from '../src/types'

/**
 * Two sessions in one day — backlog F1.
 *
 * The rule that shapes all of this is Josh's, 2026-08-24: *"I cannot be allowed
 * to lift twice in one day."* A date holds at most one lift-family row and one
 * cardio-family row, which is why there is no slot index anywhere.
 *
 * These are pure — no IndexedDB — so the repair logic can be exercised
 * exhaustively. `test/dataSafety.test.ts` covers the same rules through a real
 * Dexie database.
 */

const row = (over: Partial<SessionLog> = {}): SessionLog => ({
  id: 1,
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

const run = (over: Partial<SessionLog> = {}): SessionLog =>
  row({ id: 2, type: 'run', title: 'Easy 5k', exercises: [], ...over })

// ---------------------------------------------------------------------------

describe('familyOf', () => {
  it('groups a lift and an SE session together', () => {
    expect(familyOf('lift')).toBe('lift')
    // 'se' is legacy but Josh's logged history still carries it, and it must keep
    // behaving like the lift it is — not fall through to 'rest'.
    expect(familyOf('se')).toBe('lift')
    expect(familyOf('se')).not.toBe('rest')
  })

  it('groups a run and a HIC session together', () => {
    expect(familyOf('run')).toBe('cardio')
    expect(familyOf('hic')).toBe('cardio')
    expect(familyOf('hic')).not.toBe('lift')
  })

  it('leaves rest on its own', () => {
    expect(familyOf('rest')).toBe('rest')
  })
})

// ---------------------------------------------------------------------------

describe('repairDate keeps different kinds of session apart (backlog F1)', () => {
  it('does NOT merge a run and a lift on one date', () => {
    // THE regression. Merging these is what audit code-01 F7 was about: the lift
    // kept the run's stravaId and distance while overwriting its type, so the run
    // stopped counting as a run. Under MASS this is a normal week — Green
    // conditioning IS the running (p.99).
    const { keep, deleteIds } = repairDate([run({ stravaId: 99, distanceKm: 5 }), row()])
    expect(keep).toHaveLength(2)
    expect(keep).not.toHaveLength(1) // the old behaviour, and the whole bug
    expect(deleteIds).toEqual([])
    expect(rowOfFamily(keep, 'cardio')!.stravaId).toBe(99)
    expect(rowOfFamily(keep, 'cardio')!.distanceKm).toBe(5)
    expect(rowOfFamily(keep, 'lift')!.exercises).toHaveLength(1)
  })

  it('still merges two rows of the SAME kind (audit A6)', () => {
    const { keep, deleteIds } = repairDate([
      row({ id: 1, exercises: [], done: false }),
      row({ id: 2, done: true }),
    ])
    expect(keep).toHaveLength(1)
    // The lowest id survives, because that is the row the UI has been editing.
    expect(keep[0].id).toBe(1)
    // ...but it takes the richer row's training, not just its own emptiness.
    expect(keep[0].exercises).toHaveLength(1)
    expect(keep[0].done).toBe(true)
    expect(deleteIds).toEqual([2])
  })

  it('merges duplicates within each family independently', () => {
    const { keep, deleteIds } = repairDate([
      row({ id: 1, exercises: [] }),
      row({ id: 2 }),
      run({ id: 3, done: false }),
      run({ id: 4, stravaId: 7, avgHr: 142 }),
    ])
    expect(keep).toHaveLength(2)
    expect(deleteIds.sort()).toEqual([2, 4])
    expect(rowOfFamily(keep, 'lift')!.exercises).toHaveLength(1)
    // The surviving cardio row is id 3 (lowest id, the one the UI could see) but
    // it takes the Strava link and its metrics off the row being retired.
    expect(rowOfFamily(keep, 'cardio')!.id).toBe(3)
    expect(rowOfFamily(keep, 'cardio')!.stravaId).toBe(7)
    expect(rowOfFamily(keep, 'cardio')!.avgHr).toBe(142)
  })

  it('leaves a single row completely alone', () => {
    const only = row()
    const { keep, deleteIds } = repairDate([only])
    expect(keep[0]).toBe(only)
    expect(deleteIds).toEqual([])
  })
})

describe('repairDate and the auto-completed rest day', () => {
  const rest = (over: Partial<SessionLog> = {}): SessionLog =>
    row({ id: 5, type: 'rest', title: 'Rest', exercises: [], ...over })

  it('drops an empty rest row once real work shares the date', () => {
    // `autoCompleteRestDays` ticks a past rest day off. Pulling a session forward
    // onto that date makes the rest row a lie — a day you trained on is not a
    // rest day, and left in place it inflates the weekly session count.
    const { keep, deleteIds } = repairDate([rest(), row()])
    expect(keep).toHaveLength(1)
    expect(keep[0].type).toBe('lift')
    expect(deleteIds).toEqual([5])
  })

  it('KEEPS a rest row that carries something a user or a sync put there', () => {
    // A hike logged on a rest day, or one Strava enriched. Discarding it would be
    // data loss, which is the one thing this project will not trade for tidiness.
    const { keep } = repairDate([rest({ stravaId: 4242, distanceKm: 8 }), row()])
    expect(keep).toHaveLength(2)
    expect(keep.some((r) => r.type === 'rest')).toBe(true)
  })

  it('leaves a rest row alone when it is the only thing on the date', () => {
    const { keep, deleteIds } = repairDate([rest(), rest({ id: 6 })])
    expect(keep).toHaveLength(1)
    expect(deleteIds).toEqual([6])
  })
})

// ---------------------------------------------------------------------------

describe('mergeRows folds field by field, not row by row', () => {
  it('keeps the Strava link from one row and the training from the other', () => {
    // The duplicate carrying the Strava link is usually the one with no logged
    // sets, so keeping either row wholesale throws half the day away.
    const merged = mergeRows([
      row({ id: 1, exercises: [], done: false }),
      row({ id: 2, stravaId: 88, avgHr: 150, done: true }),
    ])
    expect(merged.id).toBe(1)
    expect(merged.stravaId).toBe(88)
    expect(merged.avgHr).toBe(150)
    expect(merged.done).toBe(true)
  })

  it('takes the earliest createdAt', () => {
    const merged = mergeRows([row({ id: 1, createdAt: 500 }), row({ id: 2, createdAt: 100 })])
    expect(merged.createdAt).toBe(100)
    expect(merged.createdAt).not.toBe(500)
  })

  it('carries a pulledFrom marker through a merge', () => {
    const merged = mergeRows([row({ id: 1 }), row({ id: 2, pulledFrom: '2026-08-19' })])
    expect(merged.pulledFrom).toBe('2026-08-19')
  })
})

// ---------------------------------------------------------------------------

describe('pulling a session forward', () => {
  const all = [
    row({ id: 1, date: '2026-08-18', type: 'run', exercises: [] }),
    row({ id: 2, date: '2026-08-18', pulledFrom: '2026-08-19', done: true }),
  ]

  it('reports the day a session was borrowed from as covered', () => {
    // Josh's case: travelling Wednesday, so Wednesday's lift is done on Tuesday
    // night after Tuesday morning's run.
    expect(coverFor(all, '2026-08-19')!.id).toBe(2)
    expect(coverFor(all, '2026-08-19')!.date).toBe('2026-08-18')
  })

  it('does not report a day nothing was borrowed from', () => {
    expect(coverFor(all, '2026-08-20')).toBeUndefined()
    // And emphatically not the day the work was actually DONE — that day has its
    // own row and is not covered by anything.
    expect(coverFor(all, '2026-08-18')).toBeUndefined()
  })

  it('lists every covered date', () => {
    expect([...pulledForwardDates(all)]).toEqual(['2026-08-19'])
  })
})

describe('pullForwardBlocker enforces "no lifting twice in one day"', () => {
  it('refuses a second lift on a day that already has one', () => {
    expect(pullForwardBlocker([row()], 'lift')).toMatch(/twice in one day/)
  })

  it('allows a lift onto a day holding only a run', () => {
    // "Run in the morning & lift in the night" — Josh, 2026-08-24.
    expect(pullForwardBlocker([run()], 'lift')).toBeNull()
  })

  it('allows a run onto a day holding only a lift', () => {
    // The same in reverse, which he also asked for.
    expect(pullForwardBlocker([row()], 'cardio')).toBeNull()
  })

  it('refuses a second conditioning session', () => {
    expect(pullForwardBlocker([run()], 'cardio')).not.toBeNull()
  })

  it('refuses to bring a rest day forward', () => {
    expect(pullForwardBlocker([], 'rest')).not.toBeNull()
  })

  it('allows anything onto an empty day', () => {
    expect(pullForwardBlocker([], 'lift')).toBeNull()
    expect(pullForwardBlocker([], 'cardio')).toBeNull()
  })
})
