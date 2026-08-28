import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { BRAVO_GRID, BRAVO_PROTOCOL, bravoLateWeek, bravoSlot } from '../src/protocols/bravo'
import { H1_EXAMPLE, H2_EXAMPLE, hClusterOverlapIds } from '../src/protocols/specificity'
import { sessionFor, PROTOCOLS } from '../src/program'
import { DEFAULT_SETTINGS } from '../src/db'
import { applyBeginnerProgress } from '../src/beginner'
import { conditioningDaysFor } from '../src/protocols/conditioningPlan'
import type { OneRmEntry, Settings } from '../src/types'

const settings = (over: Partial<Settings> = {}): Settings => ({
  ...DEFAULT_SETTINGS,
  currentPhaseId: 'bravo',
  phaseStartDate: '2026-08-17',
  ...over,
})

const max = (exerciseId: string, kg: number): OneRmEntry => ({
  protocolId: 'mass',
  exerciseId,
  exerciseName: exerciseId,
  kg,
  unit: 'total',
  source: 'estimated',
  testedAt: '2026-08-22',
  progressedKg: 0,
})

const pctOf = (p: { loading: unknown }) => (p.loading as { percent: number }).percent

describe('the p.81 programming grid, cell for cell', () => {
  it('sets × reps are 4–5 × 12 / 10 / 8', () => {
    expect([1, 2, 3].map((w) => [BRAVO_GRID[w].early.setsMin, BRAVO_GRID[w].early.setsMax, BRAVO_GRID[w].early.reps])).toEqual([
      [4, 5, 12],
      [4, 5, 10],
      [4, 5, 8],
    ])
  })

  it('Day 4/5 are 5 percentage points heavier than Day 1/2 — not the same cell twice', () => {
    expect([1, 2, 3].map((w) => [pctOf(BRAVO_GRID[w].early), pctOf(BRAVO_GRID[w].late)])).toEqual([
      [50, 55],
      [60, 65],
      [70, 75],
    ])
    expect(pctOf(BRAVO_GRID[1].early)).not.toBe(pctOf(BRAVO_GRID[1].late))
  })
})

describe('week layout (p.80)', () => {
  it('H1 H2 rest H1 H2', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(bravoSlot)).toEqual(['h1', 'h2', null, 'h1', 'h2', null, null])
    expect(bravoLateWeek(0)).toBe(false)
    expect(bravoLateWeek(3)).toBe(true)
  })

  it('is a specificity protocol with Black conditioning and MASS maxes', () => {
    expect(BRAVO_PROTOCOL.family).toBe('specificity')
    expect(BRAVO_PROTOCOL.conditioning).toBe('black')
    expect(BRAVO_PROTOCOL.liftingDays).toEqual([0, 1, 3, 4])
    expect(PROTOCOLS.bravo.id).toBe('bravo')
  })
})

describe('session resolution', () => {
  const maxes = { bench: max('bench', 80) }

  it('Monday week 1 is H1 at 50%, Thursday H1 at 55%', () => {
    const mon = sessionFor('bravo', 1, 0, settings(), maxes)
    const thu = sessionFor('bravo', 1, 3, settings(), maxes)
    expect(mon.title).toBe('Bravo — H1')
    expect(thu.title).toBe('Bravo — H1')
    expect(mon.scheme).toMatch(/50%/)
    expect(thu.scheme).toMatch(/55%/)
    expect(mon.scheme).not.toMatch(/55%/)
    const benchMon = mon.exercises.find((e) => e.exerciseId === 'bench')!
    const benchThu = thu.exercises.find((e) => e.exerciseId === 'bench')!
    expect(benchMon.sets[0].targetKg).toBe(40)
    expect(benchThu.sets[0].targetKg).toBe(44)
    expect(benchMon.setsMin).toBe(4)
    expect(benchMon.setsMax).toBe(5)
  })

  it('H1 membership is not H2 membership', () => {
    const h1 = sessionFor('bravo', 1, 0, settings(), maxes)
    const h2 = sessionFor('bravo', 1, 1, settings(), maxes)
    expect(h1.exercises.map((e) => e.name)).toEqual(H1_EXAMPLE.map((e) => e.name))
    expect(h2.exercises.map((e) => e.name)).toEqual(H2_EXAMPLE.map((e) => e.name))
    expect(h1.title).toBe('Bravo — H1')
    expect(h2.title).toBe('Bravo — H2')
  })

  it('the book example does not put the same lift in H1 and H2', () => {
    expect(hClusterOverlapIds(settings())).toEqual([])
  })
})

describe('Black stays off Bravo lifting days (p.99)', () => {
  it('filters Mon/Tue/Thu/Fri even if they were requested', () => {
    const days = conditioningDaysFor(BRAVO_PROTOCOL, settings({ mass: { conditioningDays: [0, 1, 2, 3, 4, 5] } }))
    for (const d of BRAVO_PROTOCOL.liftingDays) expect(days).not.toContain(d)
    expect(days).toContain(2)
  })
})

describe('protocol scoping', () => {
  it('finishing Bravo cannot write Beginner dumbbell maxes', () => {
    const log = [{ name: 'Bench Press', sets: [{ weight: 40, reps: 12, done: true }] }]
    expect(applyBeginnerProgress(settings({ beginner: { lifts: { bg_bench: 10 } } }), 'A', log, 'bravo')).toBeNull()
  })
})
