import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import {
  PROTOCOLS,
  DEFAULT_PHASE_ID,
  protocolFor,
  resolvePosition,
  sessionFor,
  liftingOrdinalFor,
  programSessionName,
} from '../src/program'
import { beginnerSessionFor, BEGINNER_PROTOCOL, LP_A, LP_B } from '../src/beginner'
import { protocolExercises, findExercise, sets, setsRange, type Protocol } from '../src/protocol'
import { DEFAULT_SETTINGS } from '../src/db'
import type { Settings } from '../src/types'

// Step 3 of the MASS rebuild (docs/mass-design.md §9) is a pure refactor: replace
// the `PHASES` map and the hardcoded `sessionFor` delegation with a protocol
// registry. The single most important thing to prove is that Beginner behaves
// EXACTLY as before, because Josh is keeping it as a fallback and 23 sessions of
// real history render through it.

const settings = (over: Partial<Settings> = {}): Settings => ({
  ...DEFAULT_SETTINGS,
  phaseStartDate: '2026-08-17', // a Monday
  ...over,
})

describe('the registry', () => {
  it('holds Beginner and defaults to it', () => {
    expect(Object.keys(PROTOCOLS)).toContain('beginner')
    expect(DEFAULT_PHASE_ID).toBe('beginner')
    expect(protocolFor('beginner').id).toBe('beginner')
  })

  it('falls back rather than throwing on an unknown or missing id', () => {
    // A restored backup can carry a phase id from the removed TB programme.
    expect(protocolFor('operator').id).toBe('beginner')
    expect(protocolFor(undefined).id).toBe('beginner')
    expect(protocolFor('').id).toBe('beginner')
  })

  it('exposes Beginner’s lifts as clusters, so screens need not import them', () => {
    // docs/codebase-map.md §8.2: five screens used to import a hardcoded lift
    // list directly, which locked the app to one cluster shape.
    const ex = protocolExercises(BEGINNER_PROTOCOL)
    expect(ex).toHaveLength(LP_A.length + LP_B.length)
    expect(findExercise(BEGINNER_PROTOCOL, 'bg_squat')?.name).toBe('Goblet / Front-rack Squat')
    expect(findExercise(BEGINNER_PROTOCOL, 'nope')).toBeUndefined()
  })

  it('marks Beginner as legacy with no conditioning colour', () => {
    expect(BEGINNER_PROTOCOL.family).toBe('legacy')
    expect(BEGINNER_PROTOCOL.conditioning).toBe('none')
    expect(BEGINNER_PROTOCOL.liftingDays).toEqual([0, 2, 4])
  })
})

describe('Beginner is unchanged by the refactor', () => {
  it('produces an identical plan for every week and day, through dispatch', () => {
    const s = settings()
    for (let week = 1; week <= 12; week++) {
      for (let day = 0; day <= 6; day++) {
        expect(sessionFor('beginner', week, day, s)).toEqual(beginnerSessionFor(week, day, s))
      }
    }
  })

  it('still routes an unknown phase id to the Beginner plan', () => {
    const s = settings({ currentPhaseId: 'operator' })
    expect(sessionFor('operator', 2, 0, s)).toEqual(beginnerSessionFor(2, 0, s))
  })

  it('keeps lift days on Mon/Wed/Fri and run days on Tue/Thu/Sat', () => {
    const s = settings()
    expect([0, 2, 4].map((d) => sessionFor('beginner', 1, d, s).type)).toEqual(['lift', 'lift', 'lift'])
    expect([1, 3, 5].map((d) => sessionFor('beginner', 1, d, s).type)).toEqual(['run', 'run', 'run'])
    expect(sessionFor('beginner', 1, 6, s).type).toBe('rest')
  })

  it('still names synced activities the same way', () => {
    const s = settings()
    expect(programSessionName('beginner', 2, 3, 'run', s)).toBe('Beginner · Wk2 · Run 2')
    expect(programSessionName('beginner', 2, 1, 'run', s)).toBe('Beginner · Wk2 · Run 1')
  })
})

describe('resolvePosition', () => {
  const s = settings()

  it('maps dates onto week and day, Monday-based', () => {
    expect(resolvePosition(s, new Date(2026, 7, 17))).toMatchObject({ week: 1, day: 0, status: 'active' })
    expect(resolvePosition(s, new Date(2026, 7, 19))).toMatchObject({ week: 1, day: 2 })
    expect(resolvePosition(s, new Date(2026, 7, 24))).toMatchObject({ week: 2, day: 0 })
  })

  it('reports "before" ahead of the start date without throwing', () => {
    expect(resolvePosition(s, new Date(2026, 7, 10)).status).toBe('before')
  })

  it('carries the phase id through, falling back for a dead one', () => {
    expect(resolvePosition(settings({ currentPhaseId: 'operator' }), new Date(2026, 7, 17)).phaseId).toBe(
      'beginner',
    )
  })
})

describe('liftingOrdinalFor — the Grey Man A/B selector', () => {
  // Grey Man is not built yet, but the ordinal is, and it is the thing that
  // would be silently wrong if implemented as day-of-week or week parity.
  const greyManish = { liftingDays: [0, 2, 4] } as Protocol

  it('numbers lifting sessions consecutively across the block', () => {
    const seq = [
      [1, 0], [1, 2], [1, 4],
      [2, 0], [2, 2], [2, 4],
      [3, 0], [3, 2], [3, 4],
    ].map(([w, d]) => liftingOrdinalFor(greyManish, w, d))
    expect(seq).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('alternates A/B exactly as the book’s grid prints it (p.50)', () => {
    // Week 1: A B A · Week 2: B A B · Week 3: A B A
    const ab = (w: number, d: number) => (liftingOrdinalFor(greyManish, w, d) % 2 === 0 ? 'A' : 'B')
    expect([ab(1, 0), ab(1, 2), ab(1, 4)]).toEqual(['A', 'B', 'A'])
    expect([ab(2, 0), ab(2, 2), ab(2, 4)]).toEqual(['B', 'A', 'B'])
    expect([ab(3, 0), ab(3, 2), ab(3, 4)]).toEqual(['A', 'B', 'A'])
  })

  it('is NOT day-of-week — the trap the old switch(day) fell into', () => {
    // Day 1 is A in week 1 but B in week 2. A day-based selector cannot do that.
    const ab = (w: number, d: number) => (liftingOrdinalFor(greyManish, w, d) % 2 === 0 ? 'A' : 'B')
    expect(ab(1, 0)).not.toBe(ab(2, 0))
  })

  it('is NOT week parity either', () => {
    // Week parity would make every session in a week the same cluster.
    const ab = (w: number, d: number) => (liftingOrdinalFor(greyManish, w, d) % 2 === 0 ? 'A' : 'B')
    expect(ab(1, 0)).not.toBe(ab(1, 2))
  })

  it('returns -1 on a non-lifting day', () => {
    expect(liftingOrdinalFor(greyManish, 1, 1)).toBe(-1)
    expect(liftingOrdinalFor(greyManish, 2, 6)).toBe(-1)
  })

  it('is exposed on the resolved position', () => {
    const s = settings()
    // Beginner shares Grey Man's Mon/Wed/Fri, so the ordinal is meaningful here too.
    expect(resolvePosition(s, new Date(2026, 7, 19)).liftingOrdinal).toBe(1)
    expect(resolvePosition(s, new Date(2026, 7, 18)).liftingOrdinal).toBe(-1)
  })
})

describe('Prescription helpers', () => {
  it('sets() pins a fixed count', () => {
    expect(sets(4, 12, { kind: 'barbell', percent: 55 })).toEqual({
      setsMin: 4,
      setsMax: 4,
      reps: 12,
      loading: { kind: 'barbell', percent: 55 },
      basis: '1rm',
    })
  })

  it('setsRange() carries the book’s printed range, e.g. "4-5 x 8"', () => {
    const p = setsRange(4, 5, 8, { kind: 'barbell', percent: 70 })
    expect(p.setsMin).toBe(4)
    expect(p.setsMax).toBe(5)
    expect(p.reps).toBe(8)
  })

  it('defaults the basis to 1RM — tm90 is opt-in, per cluster', () => {
    // The training max is recommended for the Bulgarian cluster only (pp.88-89).
    // Nothing should get it by accident.
    expect(sets(3, 5, { kind: 'barbell', percent: 80 }).basis).toBe('1rm')
    expect(setsRange(4, 5, 8, { kind: 'barbell', percent: 70 }).basis).toBe('1rm')
    expect(sets(3, 5, { kind: 'barbell', percent: 80 }, 'tm90').basis).toBe('tm90')
  })
})
