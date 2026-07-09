import { describe, it, expect } from 'vitest'
import { estimate1RM, trainingMax, workingLoad, maxToBasis, effective1RM } from '../src/lib/calc'
import { bumpedEntry, suggestBlockProgression, stalledLiftsSinceRetest } from '../src/lib/progression'
import { OPERATOR_WAVE, OPERATOR_LIFTS, maxesMap } from '../src/program'
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

describe('90% Training-Max basis — the DEFAULT for Operator (K. Black, forum t=145)', () => {
  // KB ties the TM to high-frequency templates like Operator: the "greasing the
  // groove" effect gives breathing room on load so every session is hittable,
  // even on a bad day. This is the app's default (settings.loadBasis='tm'); true
  // 1RM is the advanced opt-in. Verified vs TB forum + community + book audit.
  it('Bench 30×5 on TM basis → the weekly loads Josh actually sees', () => {
    // 1RM 33.75 → TM 30.375; ×[70,80,90,75,85,95]%, floor 2kg
    expect(weekLoads(30, 5, 'tm')).toEqual([20, 24, 26, 22, 24, 28])
  })
  it('is ~10% below the true-1RM basis, as intended', () => {
    const tm = weekLoads(40, 5, 'tm')
    const oneRm = weekLoads(40, 5, '1rm')
    expect(tm.every((w, i) => w <= oneRm[i])).toBe(true)
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

describe('retest-ladder stall detection — PER-LIFT (TB1 p109 safety net)', () => {
  // current est-1RM (Brzycki): bench 24.75, squat 31.5, row 20.25; steps 2.5/5/2.5
  const items = suggestBlockProgression(
    OPERATOR_LIFTS,
    maxesMap([
      { liftId: 'op_bench', testWeight: 22, testReps: 5, bumpKg: 0 },
      { liftId: 'op_squat', testWeight: 28, testReps: 5, bumpKg: 0 },
      { liftId: 'op_row', testWeight: 18, testReps: 5, bumpKg: 0 },
    ]),
  )

  it('returns nothing before there is a prior retest', () => {
    expect(stalledLiftsSinceRetest(items, undefined)).toEqual([])
    expect(stalledLiftsSinceRetest(items, [])).toEqual([])
  })
  it('flags a lift whose retest gain ≤ its own bump', () => {
    // bench +2.0 ≤ 2.5 → stall; squat +6 > 5, row +3 > 2.5 → fine
    const hist = [{ date: 'x', lifts: { op_bench: 22.75, op_squat: 25.5, op_row: 17.25 } }]
    expect(stalledLiftsSinceRetest(items, hist).map((s) => s.liftId)).toEqual(['op_bench'])
  })
  it('flags nothing when every lift out-gains its bump', () => {
    const hist = [{ date: 'x', lifts: { op_bench: 20, op_squat: 24, op_row: 16 } }]
    expect(stalledLiftsSinceRetest(items, hist)).toEqual([])
  })
  it('can flag multiple stalled lifts', () => {
    // bench +2 ≤ 2.5 stall; squat +4.5 ≤ 5 stall; row +3 > 2.5 fine
    const hist = [{ date: 'x', lifts: { op_bench: 22.75, op_squat: 27, op_row: 17.25 } }]
    expect(stalledLiftsSinceRetest(items, hist).map((s) => s.liftId).sort()).toEqual([
      'op_bench',
      'op_squat',
    ])
  })
})
