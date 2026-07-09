import { describe, it, expect } from 'vitest'
import { estimate1RM, trainingMax, workingLoad, maxToBasis, effective1RM } from '../src/lib/calc'
import { bumpedEntry } from '../src/lib/progression'
import { OPERATOR_WAVE } from '../src/program'
import type { MaxEntry } from '../src/types'

// These assert the app matches Tactical Barbell (K. Black) 3rd-ed maths exactly.
// Sources cited inline are the weight-math fidelity audit (docs/weight-math-audit.md).

describe('estimate1RM — Brzycki, matches KB’s book worked examples (TB1 p104/106/112)', () => {
  it('reproduces the book’s printed 1RMs', () => {
    expect(Math.round(estimate1RM(375, 5))).toBe(422) // squat 375×5 → 422
    expect(Math.round(estimate1RM(230, 3))).toBe(244) // bench 230×3 → 244
  })
  it('is Brzycki, not Epley (Epley would over-estimate)', () => {
    // 30kg × 5: Brzycki 33.75, Epley would be 35.0
    expect(estimate1RM(30, 5)).toBeCloseTo(33.75, 2)
    expect(estimate1RM(40, 5)).toBeCloseTo(45, 2)
    expect(estimate1RM(24, 5)).toBeCloseTo(27, 2)
  })
  it('a 1-rep max is the weight itself', () => {
    expect(estimate1RM(50, 1)).toBeCloseTo(50, 5)
  })
  it('is safe at the degenerate boundaries', () => {
    expect(estimate1RM(0, 5)).toBe(0)
    expect(estimate1RM(50, 0)).toBe(0)
    expect(estimate1RM(50, 37)).toBe(50)
  })
})

describe('trainingMax = 90% of 1RM (TB1 p153)', () => {
  it('is exactly 0.9×', () => {
    expect(trainingMax(100)).toBe(90)
    expect(trainingMax(33.75)).toBeCloseTo(30.375, 3)
  })
})

describe('Operator wave shape (TB1 p63)', () => {
  it('is 70/80/90/75/85/95 with the right reps', () => {
    expect(OPERATOR_WAVE.map((w) => w.pct)).toEqual([70, 80, 90, 75, 85, 95])
    expect(OPERATOR_WAVE.map((w) => w.reps)).toEqual([5, 5, 3, 5, 3, 2])
    expect(OPERATOR_WAVE.every((w) => w.sets === 3)).toBe(true)
  })
})

// Reproduce program.ts's per-week working weight: workingLoad(basisMax, pct, inc).
function weekLoads(testWeight: number, testReps: number, basis: 'tm' | '1rm', inc: 1 | 2 = 2): number[] {
  const entry: MaxEntry = { liftId: 'x', testWeight, testReps, bumpKg: 0 }
  const basisMax = maxToBasis(entry, basis)
  return OPERATOR_WAVE.map((w) => workingLoad(basisMax, w.pct, inc).kg)
}

describe('Operator working weights off the TRUE 1RM — book §4B, floor-round 2kg', () => {
  it('Bench 30×5 → book weeks', () => {
    expect(weekLoads(30, 5, '1rm')).toEqual([22, 26, 30, 24, 28, 32])
  })
  it('Squat 40×5 → book weeks', () => {
    expect(weekLoads(40, 5, '1rm')).toEqual([30, 36, 40, 32, 38, 42])
  })
  it('Row 24×5 → book weeks', () => {
    expect(weekLoads(24, 5, '1rm')).toEqual([18, 20, 24, 20, 22, 24])
  })
})

describe('90% Training-Max basis is exactly 0.9× the 1RM-basis loads (before rounding)', () => {
  it('Bench 30×5 on TM basis lands ~10% lighter', () => {
    // 1RM 33.75 → TM 30.375; wk1 70% = 21.26 → floor 20; wk6 95% = 28.86 → floor 28
    const tm = weekLoads(30, 5, 'tm')
    expect(tm[0]).toBe(20)
    expect(tm[5]).toBe(28)
  })
})

describe('load clamps (4kg floor, 60kg ceiling, overCeiling flag)', () => {
  it('flags loads above the 60kg dumbbell ceiling', () => {
    const r = workingLoad(90, 95, 2)
    expect(r.overCeiling).toBe(true)
    expect(r.kg).toBe(60)
  })
  it('floors up to the 4kg minimum', () => {
    const r = workingLoad(4, 70, 2)
    expect(r.underFloor).toBe(true)
    expect(r.kg).toBe(4)
  })
})

describe('forced progression adds the increment to the 1RM (TB1 p107)', () => {
  it('bumps bumpKg and raises the effective 1RM by the step', () => {
    const e: MaxEntry = { liftId: 'op_bench', testWeight: 30, testReps: 5, bumpKg: 0 }
    const bumped = bumpedEntry(e, 2.5)
    expect(bumped.bumpKg).toBe(2.5)
    expect(effective1RM(bumped)).toBeCloseTo(36.25, 2) // 33.75 + 2.5
  })
  it('accumulates across blocks', () => {
    let e: MaxEntry = { liftId: 'op_squat', testWeight: 40, testReps: 5, bumpKg: 0 }
    e = bumpedEntry(e, 5)
    e = bumpedEntry(e, 5)
    expect(e.bumpKg).toBe(10)
    expect(effective1RM(e)).toBeCloseTo(55, 2) // 45 + 10
  })
})
