import { describe, it, expect } from 'vitest'
import {
  loadBar,
  targetLoad,
  bodyweightReps,
  weightedBodyweightAddedKg,
  DEFAULT_BAR_SETUP,
  type BarSetup,
} from '../src/lib/barbell'

// Fixtures follow the pattern set by test/calc.test.ts: assert the book's own
// printed numbers, and — where the app had to choose a rule the book does not
// give — assert explicitly that the result is NOT the plausible wrong answer.
// See docs/mass-design.md §4 and §7.

/** Josh's kit: 20 kg bar, standard kg plates, smallest bar jump 2.5 kg. */
const KIT = DEFAULT_BAR_SETUP

const total = (t: number, s: BarSetup = KIT) => loadBar(t, s).totalKg

describe('loadBar — exact loads', () => {
  it('loads the bar alone when the target is bar weight', () => {
    const r = loadBar(20)
    expect(r.totalKg).toBe(20)
    expect(r.perSide).toEqual([])
    expect(r.belowBar).toBe(false)
  })

  it('hits round targets exactly and reports the per-side plates', () => {
    const r = loadBar(70)
    expect(r.totalKg).toBe(70)
    expect(r.deltaKg).toBe(0)
    expect(r.perSide).toEqual([{ kg: 25, count: 1 }])
  })

  it('builds a heavier load from multiple denominations', () => {
    const r = loadBar(100)
    expect(r.totalKg).toBe(100)
    expect(r.perSide.reduce((sum, p) => sum + p.kg * p.count, 0)).toBe(40)
  })

  it('per-side plates always sum to exactly half the load above the bar', () => {
    for (const t of [22.5, 35, 47.5, 62.5, 85, 117.5, 140]) {
      const r = loadBar(t)
      const perSide = r.perSide.reduce((sum, p) => sum + p.kg * p.count, 0)
      expect(r.totalKg).toBeCloseTo(KIT.barKg + perSide * 2, 6)
    }
  })
})

describe('loadBar — the rounding rule (a deviation; the book gives none)', () => {
  // The smallest jump on this kit is 2.5 kg, so loadable totals are 20, 22.5, 25…
  it('rounds to the NEAREST loadable weight, up as readily as down', () => {
    expect(total(38)).toBe(37.5) // 0.5 down beats 2.0 up
    expect(total(39.5)).toBe(40) // 0.5 up beats 2.0 down
  })

  it('rounds DOWN on an exact tie', () => {
    // 38.75 sits precisely between 37.5 and 40.
    expect(total(38.75)).toBe(37.5)
    expect(total(21.25)).toBe(20)
    expect(total(103.75)).toBe(102.5)
  })

  it('is NOT always-round-down — the rule we deliberately rejected', () => {
    // Always-down would give 30 here, 6% light on every set. See docs/mass-design.md §4.
    expect(total(32)).toBe(32.5)
    expect(total(32)).not.toBe(30)
    expect(total(69)).toBe(70)
    expect(total(69)).not.toBe(67.5)
  })

  it('never misses by more than half an increment', () => {
    for (let t = 20; t <= 200; t += 0.25) {
      expect(Math.abs(loadBar(t).deltaKg)).toBeLessThanOrEqual(1.25 + 1e-9)
    }
  })

  it('reports the untouched target alongside the loaded weight', () => {
    // The deviation has to stay visible — this is part of the rule, not decoration.
    const r = loadBar(68.31)
    expect(r.targetKg).toBe(68.31)
    expect(r.totalKg).toBe(67.5)
    expect(r.deltaKg).toBe(-0.81)
  })
})

describe('loadBar — below bar weight (p.31 covers SE only; app warns)', () => {
  it('flags a target under the empty bar and loads the bar', () => {
    const r = loadBar(15)
    expect(r.belowBar).toBe(true)
    expect(r.totalKg).toBe(20)
    expect(r.perSide).toEqual([])
    expect(r.deltaKg).toBe(5)
  })

  it('does not flag a target at or above bar weight', () => {
    expect(loadBar(20).belowBar).toBe(false)
    expect(loadBar(25).belowBar).toBe(false)
  })

  it('is safe at degenerate inputs', () => {
    expect(loadBar(0).totalKg).toBe(20)
    expect(loadBar(-50).totalKg).toBe(20)
    expect(loadBar(Number.NaN).totalKg).toBe(20)
  })
})

describe('loadBar — inventory is respected, not assumed', () => {
  it('solves exactly where greedy heaviest-first would fail', () => {
    // Wanting 20 kg per side from 15s and 10s: greedy takes a 15 and cannot
    // finish. 10 + 10 is exact.
    const odd: BarSetup = { barKg: 20, plates: [{ kg: 15 }, { kg: 10 }] }
    const r = loadBar(60, odd)
    expect(r.totalKg).toBe(60)
    expect(r.perSide).toEqual([{ kg: 10, count: 2 }])
  })

  it('honours a limited number of pairs', () => {
    const scarce: BarSetup = { barKg: 20, plates: [{ kg: 20, pairs: 1 }, { kg: 5, pairs: 1 }] }
    const r = loadBar(200, scarce)
    expect(r.totalKg).toBe(70) // 20 bar + (20 + 5) x 2
    expect(r.exhausted).toBe(true)
  })

  it('is not "exhausted" when it simply chose a nearer lighter option', () => {
    // Only 25s available, target 30: the bar alone (delta 10) beats 70 (delta 40).
    const chunky: BarSetup = { barKg: 20, plates: [{ kg: 25 }] }
    const r = loadBar(30, chunky)
    expect(r.totalKg).toBe(20)
    expect(r.exhausted).toBe(false)
  })

  it('handles an empty plate set', () => {
    const r = loadBar(100, { barKg: 20, plates: [] })
    expect(r.totalKg).toBe(20)
    expect(r.exhausted).toBe(true)
  })

  it('microplates halve the worst-case error', () => {
    const micro: BarSetup = { barKg: 20, plates: [...KIT.plates, { kg: 0.5 }] }
    expect(loadBar(38, micro).totalKg).toBe(38)
    for (let t = 20; t <= 120; t += 0.25) {
      expect(Math.abs(loadBar(t, micro).deltaKg)).toBeLessThanOrEqual(0.5 + 1e-9)
    }
  })
})

describe('targetLoad — the unrounded prescription', () => {
  it('is a plain percentage of the 1RM', () => {
    // Grey Man week 1 main lifts: 70% (MASS extraction p.51).
    expect(targetLoad(100, 70)).toBe(70)
    expect(targetLoad(97.5, 70)).toBe(68.25)
    // Week 2 is 75%, week 3 is 80% (p.51).
    expect(targetLoad(100, 75)).toBe(75)
    expect(targetLoad(100, 80)).toBe(80)
    // The S cluster runs 55 / 60 / 65% (p.51).
    expect(targetLoad(60, 55)).toBe(33)
  })
})

describe('Grey Man week 1-3, end to end (p.51)', () => {
  // A plausible starting set of 1RMs, run through the whole chain. What is being
  // pinned here is the percentages and their order, which come straight from the
  // book's grid — not the specific kilos.
  const MAIN_PCT = [70, 75, 80] // weeks 1, 2, 3
  const S_PCT = [55, 60, 65]

  it('main lifts step 70 / 75 / 80% across the block', () => {
    const squat1Rm = 100
    const loads = MAIN_PCT.map((p) => loadBar(targetLoad(squat1Rm, p)).totalKg)
    expect(loads).toEqual([70, 75, 80])
  })

  it('supplementary work steps 55 / 60 / 65% across the block', () => {
    const ohp1Rm = 50
    const loads = S_PCT.map((p) => loadBar(targetLoad(ohp1Rm, p)).totalKg)
    // 27.5 -> 27.5, 30 -> 30, 32.5 -> 32.5
    expect(loads).toEqual([27.5, 30, 32.5])
  })

  it('week 3 is always heavier than week 1 for a realistic 1RM', () => {
    for (const oneRm of [40, 55, 62.5, 80, 100, 137.5]) {
      const w1 = loadBar(targetLoad(oneRm, 70)).totalKg
      const w3 = loadBar(targetLoad(oneRm, 80)).totalKg
      expect(w3).toBeGreaterThan(w1)
    }
  })

  it('a light overhead press can fall under the bar and is flagged, not hidden', () => {
    // 55% of a 30 kg OHP is 16.5 kg — under a 20 kg bar.
    const r = loadBar(targetLoad(30, 55))
    expect(r.belowBar).toBe(true)
    expect(r.totalKg).toBe(20)
  })
})

describe('bodyweightReps — the percentage applies to REPS, not weight (p.90)', () => {
  it("reproduces the book's own worked example", () => {
    // "you can do 10 max… 3 sets x 10 reps @ 70%RM, you'd do 3 sets of 7" (p.90)
    expect(bodyweightReps(10, 70)).toBe(7)
  })

  it('is not treating the percentage as a load', () => {
    // The wrong reading gives back the prescribed 10 reps and a 70% weight.
    expect(bodyweightReps(10, 70)).not.toBe(10)
  })

  it('rounds a fraction nearest, ties down (a deviation; the book is silent)', () => {
    expect(bodyweightReps(8, 55)).toBe(4) // 4.4 -> 4
    expect(bodyweightReps(8, 60)).toBe(5) // 4.8 -> 5
    expect(bodyweightReps(5, 50)).toBe(2) // 2.5 exact tie -> down
    expect(bodyweightReps(7, 50)).toBe(3) // 3.5 exact tie -> down
  })

  it('never prescribes fewer than one rep, and is safe at zero', () => {
    expect(bodyweightReps(3, 10)).toBe(1)
    expect(bodyweightReps(0, 70)).toBe(0)
  })
})

describe('weightedBodyweightAddedKg — bodyweight is part of the sum (p.90)', () => {
  it('subtracts bodyweight from the percentage of the system max', () => {
    // 100 kg system 1RM (80 kg lifter + 20 kg belt), 80 kg bodyweight, 70%:
    // 70 kg of system => hang 70 - 80 = -10, i.e. lighter than you weigh.
    expect(weightedBodyweightAddedKg(100, 80, 70)).toBe(-10)
    expect(weightedBodyweightAddedKg(100, 80, 90)).toBe(10)
  })

  it('is NOT the naive reading that ignores bodyweight', () => {
    // The wrong version takes 70% of the ADDED weight only: 0.7 x 20 = 14 kg.
    // The book warns that gets "too heavy too fast" (p.90).
    expect(weightedBodyweightAddedKg(100, 80, 70)).not.toBe(14)
  })

  it('scales with the system max, not the added weight', () => {
    const light = weightedBodyweightAddedKg(100, 80, 85)
    const heavy = weightedBodyweightAddedKg(120, 80, 85)
    expect(heavy).toBeGreaterThan(light)
  })
})
