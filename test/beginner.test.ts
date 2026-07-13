import { describe, it, expect } from 'vitest'
import {
  c25kWorkout,
  beginnerDayLetter,
  applyBeginnerProgress,
  defaultBeginnerWeights,
  LP_A,
} from '../src/beginner'
import type { Settings } from '../src/types'

const base: Settings = {
  id: 'app',
  dbIncrement: 2,
  loadBasis: 'tm',
  currentPhaseId: 'beginner',
  phaseStartDate: '2026-07-13',
  programMode: 'beginner',
  beginner: { lifts: defaultBeginnerWeights() },
}

describe('C25K schedule', () => {
  it('week 1 is a 5-min warm-up walk then 8× (jog 60 / walk 90)', () => {
    const w = c25kWorkout(1, 0)
    expect(w.length).toBe(17) // 1 warmup + 8 jog + 8 walk
    expect(w[0]).toEqual({ kind: 'walk', sec: 300 })
    expect(w[1]).toEqual({ kind: 'jog', sec: 60 })
    expect(w.filter((i) => i.kind === 'jog').reduce((n, i) => n + i.sec, 0)).toBe(480)
  })
  it('week 5 run 3 is a 20-minute continuous jog', () => {
    expect(c25kWorkout(5, 2)).toEqual([
      { kind: 'walk', sec: 300 },
      { kind: 'jog', sec: 1200 },
    ])
  })
  it('week 9 (and beyond) is a 30-minute continuous jog', () => {
    expect(c25kWorkout(9, 0)[1]).toEqual({ kind: 'jog', sec: 1800 })
    expect(c25kWorkout(12, 1)[1]).toEqual({ kind: 'jog', sec: 1800 })
  })
})

describe('A/B alternation', () => {
  it('alternates A/B across every lift session (StrengthLog)', () => {
    expect(beginnerDayLetter(1, 0)).toBe('A') // wk1 Mon
    expect(beginnerDayLetter(1, 2)).toBe('B') // wk1 Wed
    expect(beginnerDayLetter(1, 4)).toBe('A') // wk1 Fri
    expect(beginnerDayLetter(2, 0)).toBe('B') // wk2 Mon
    expect(beginnerDayLetter(2, 2)).toBe('A') // wk2 Wed
  })
})

describe('LP double progression', () => {
  // log each lift at a chosen weight, 3 sets, a given rep count
  const loggedAt = (reps: number, weightOf: (startKg: number) => number) =>
    LP_A.map((l) => ({ name: l.name, sets: [1, 2, 3].map(() => ({ weight: weightOf(l.startKg), reps, done: true })) }))

  it('bumps a lift by its step once all 3 sets hit 12', () => {
    const next = applyBeginnerProgress(base, 'A', loggedAt(12, (kg) => kg))
    expect(next?.[LP_A[0].id]).toBe(LP_A[0].startKg + LP_A[0].step) // squat 10 → 12
  })
  it('holds the weight when reps are below the top of the range', () => {
    const next = applyBeginnerProgress(base, 'A', loggedAt(9, (kg) => kg))
    expect(next).toBeNull() // used weight == stored weight, top not cleared
  })
  it('adopts the weight actually used (self-calibrates on edits)', () => {
    const next = applyBeginnerProgress(base, 'A', loggedAt(8, () => 14))
    expect(next?.[LP_A[0].id]).toBe(14)
  })
})
