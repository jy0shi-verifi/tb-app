import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import {
  ALPHA_GRID,
  ALPHA_PROTOCOL,
  alphaSlot,
} from '../src/protocols/alpha'
import { ALPHA_MS_STANDARD, isConventionalDeadlift } from '../src/protocols/specificity'
import { sessionFor, PROTOCOLS } from '../src/program'
import { targetLoad } from '../src/lib/barbell'
import { DEFAULT_SETTINGS } from '../src/db'
import { applyBeginnerProgress } from '../src/beginner'
import type { OneRmEntry, Settings } from '../src/types'

/**
 * Book fixtures for Specificity Alpha, MASS pp.70–75.
 * Printed p.74 grid wins over p.70 prose.
 */

const settings = (over: Partial<Settings> = {}): Settings => ({
  ...DEFAULT_SETTINGS,
  currentPhaseId: 'alpha',
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

const MASS = {
  bench: max('bench', 80),
  squat: max('squat', 100),
  deadlift: max('deadlift', 140),
}

describe('the p.74 programming grid, cell for cell', () => {
  it('MS: 3×6 / 75%, 3×5 / 80%, 3×3 / 85% — not the p.70 “3–5 reps” prose', () => {
    expect([1, 2, 3].map((w) => [ALPHA_GRID[w].ms.setsMin, ALPHA_GRID[w].ms.reps, pctOf(ALPHA_GRID[w].ms)])).toEqual([
      [3, 6, 75],
      [3, 5, 80],
      [3, 3, 85],
    ])
    expect(ALPHA_GRID[1].ms.reps).not.toBe(5)
  })

  it('H: 4×12 / 65%, 4×10 / 70%, 4×8 / 75%', () => {
    expect([1, 2, 3].map((w) => [ALPHA_GRID[w].h.setsMin, ALPHA_GRID[w].h.reps, pctOf(ALPHA_GRID[w].h)])).toEqual([
      [4, 12, 65],
      [4, 10, 70],
      [4, 8, 75],
    ])
  })

  it('deadlift is 1 work set at 5 / 4 / 3, same %, not the MS scheme', () => {
    expect([1, 2, 3].map((w) => [ALPHA_GRID[w].dl.setsMin, ALPHA_GRID[w].dl.reps, pctOf(ALPHA_GRID[w].dl)])).toEqual([
      [1, 5, 75],
      [1, 4, 80],
      [1, 3, 85],
    ])
    expect(ALPHA_GRID[1].dl.reps).not.toBe(ALPHA_GRID[1].ms.reps)
    expect(ALPHA_GRID[1].dl.setsMin).not.toBe(3)
  })

  it('percentages are of the 1RM', () => {
    for (const w of [1, 2, 3]) {
      expect(ALPHA_GRID[w].ms.basis).toBe('1rm')
      expect(ALPHA_GRID[w].h.basis).toBe('1rm')
    }
  })
})

describe('week layout (p.70, p.72)', () => {
  it('Day 1 MS, Day 2 H1, Day 4 MS, Day 5 H2', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(alphaSlot)).toEqual(['ms', 'h1', null, 'ms', 'h2', null, null])
  })

  it('lifts four days — Mon Tue Thu Fri — and uses Black conditioning', () => {
    expect(ALPHA_PROTOCOL.liftingDays).toEqual([0, 1, 3, 4])
    expect(ALPHA_PROTOCOL.family).toBe('specificity')
    expect(ALPHA_PROTOCOL.conditioning).toBe('black')
    expect(ALPHA_PROTOCOL.maxScope).toBe('mass')
    expect(PROTOCOLS.alpha.id).toBe('alpha')
  })
})

describe('session resolution', () => {
  it('week 1 Monday is MS: 3 sets of 6 on squat/bench, 1×5 on deadlift', () => {
    const s = sessionFor('alpha', 1, 0, settings(), MASS)
    expect(s.title).toBe('Alpha — MS')
    const squat = s.exercises.find((e) => e.exerciseId === 'squat')!
    const bench = s.exercises.find((e) => e.exerciseId === 'bench')!
    const dl = s.exercises.find((e) => e.exerciseId === 'deadlift')!
    expect(squat.sets).toHaveLength(3)
    expect(squat.sets[0].reps).toBe(6)
    expect(squat.sets[0].targetKg).toBe(targetLoad(100, 75))
    expect(bench.sets).toHaveLength(3)
    expect(dl.sets).toHaveLength(1)
    expect(dl.sets[0].reps).toBe(5)
    expect(dl.sets[0].reps).not.toBe(6)
  })

  it('p.75 arithmetic: 75% of 300 is 225, not 210 or 250', () => {
    expect(targetLoad(300, 75)).toBe(225)
    expect(targetLoad(300, 75)).not.toBe(210)
    expect(targetLoad(100, 75)).toBe(75)
  })

  it('Tuesday is H1 at 4×12 @ 65%', () => {
    const s = sessionFor('alpha', 1, 1, settings(), MASS)
    expect(s.title).toBe('Alpha — H1')
    expect(s.exercises[0].sets).toHaveLength(4)
    expect(s.exercises[0].sets[0].reps).toBe(12)
  })

  it('once-a-week DL skips Thursday’s deadlift', () => {
    const twice = sessionFor('alpha', 1, 3, settings(), MASS)
    expect(twice.exercises.some((e) => e.exerciseId === 'deadlift')).toBe(true)
    const once = sessionFor('alpha', 1, 3, settings({ mass: { deadliftPerWeek: 1 } }), MASS)
    expect(once.exercises.some((e) => e.exerciseId === 'deadlift')).toBe(false)
    const monday = sessionFor('alpha', 1, 0, settings({ mass: { deadliftPerWeek: 1 } }), MASS)
    expect(monday.exercises.some((e) => e.exerciseId === 'deadlift')).toBe(true)
  })

  it('a cluster without conventional deadlift programs the third lift as normal MS (p.75)', () => {
    const trap = {
      id: 'h_trap_bar',
      name: 'Trap Bar Deadlift',
      defaultLoading: 'barbell' as const,
      bodyPart: 'lower' as const,
    }
    expect(isConventionalDeadlift(trap)).toBe(false)
    expect(isConventionalDeadlift(ALPHA_MS_STANDARD[2])).toBe(true)
    const s = sessionFor(
      'alpha',
      1,
      0,
      settings({
        mass: { msCluster: [ALPHA_MS_STANDARD[0], ALPHA_MS_STANDARD[1], trap] },
      }),
      { ...MASS, [trap.id]: max(trap.id, 140) },
    )
    const third = s.exercises.find((e) => e.exerciseId === trap.id)!
    expect(third.sets).toHaveLength(3)
    expect(third.sets[0].reps).toBe(6)
    expect(third.sets[0].reps).not.toBe(5)
  })
})

describe('protocol scoping', () => {
  it('finishing Alpha cannot write Beginner dumbbell maxes', () => {
    const log = [{ name: 'Bench Press', sets: [{ weight: 60, reps: 6, done: true }] }]
    expect(applyBeginnerProgress(settings({ beginner: { lifts: { bg_squat: 10 } } }), 'A', log, 'alpha')).toBeNull()
  })
})
