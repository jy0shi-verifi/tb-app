import { describe, it, expect } from 'vitest'
import {
  c25kWorkout,
  beginnerDayLetter,
  applyBeginnerProgress,
  beginnerStall,
  beginnerProgress,
  defaultBeginnerWeights,
  LP_A,
} from '../src/beginner'
import type { Settings, SessionLog } from '../src/types'

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

describe('LP stall → deload', () => {
  const sess = (date: string, reps: number, weight = 10): SessionLog => ({
    date,
    phaseId: 'beginner',
    week: 1,
    day: 0,
    type: 'lift',
    title: 'Strength — Day A',
    done: true,
    createdAt: 1,
    exercises: [{ name: 'Goblet / Front-rack Squat', sets: [{ weight, reps, done: true }, { weight, reps, done: true }, { weight, reps, done: true }] }],
  })

  it('flags a stall after 3 sessions with no rep progress at the same weight', () => {
    const hist = [sess('2026-07-01', 9), sess('2026-07-04', 9), sess('2026-07-08', 9)]
    const s = beginnerStall(hist, 'Goblet / Front-rack Squat', 10, 2)
    expect(s).toEqual({ count: 3, deloadTo: 8 }) // 10 - max(2, round(1/2)*2)=2 → 8
  })
  it('does NOT flag while reps are still improving', () => {
    const hist = [sess('2026-07-08', 11), sess('2026-07-04', 10), sess('2026-07-01', 9)]
    expect(beginnerStall(hist, 'Goblet / Front-rack Squat', 10, 2)).toBeNull()
  })
  it('does NOT flag when the top of the range is reached (that bumps instead)', () => {
    const hist = [sess('2026-07-01', 12), sess('2026-07-04', 12), sess('2026-07-08', 12)]
    expect(beginnerStall(hist, 'Goblet / Front-rack Squat', 10, 2)).toBeNull()
  })
  it('needs at least 3 sessions before judging a stall', () => {
    expect(beginnerStall([sess('2026-07-01', 9), sess('2026-07-04', 9)], 'Goblet / Front-rack Squat', 10, 2)).toBeNull()
  })
})

describe('beginnerProgress', () => {
  const settings: Settings = { ...base, beginner: { lifts: { ...defaultBeginnerWeights(), bg_squat: 14 } } }
  const first: SessionLog = {
    date: '2026-07-01', phaseId: 'beginner', week: 1, day: 0, type: 'lift', title: 'Strength — Day A',
    done: true, createdAt: 1,
    exercises: [{ name: 'Goblet / Front-rack Squat', sets: [{ weight: 10, reps: 12, done: true }] }],
  }
  it('reports start (first logged) → current (working) weight + delta', () => {
    const squat = beginnerProgress([first], settings).find((p) => p.id === 'bg_squat')!
    expect(squat).toMatchObject({ start: 10, current: 14, delta: 4 })
  })
  it('shows delta 0 for a lift never logged (start = current default)', () => {
    const ohp = beginnerProgress([first], settings).find((p) => p.id === 'bg_ohp')!
    expect(ohp.delta).toBe(0)
  })
})
