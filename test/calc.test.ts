import { describe, it, expect } from 'vitest'
import { estimate1RM } from '../src/lib/calc'

// The Tactical Barbell load-math suite that used to live here (training max,
// percentage working weights, forced progression, the retest ladder) was removed
// along with the code it covered — that programme is being rebuilt from the books.
// What remains is the estimated-1RM formula, which is still used for display.
//
// These assertions are worth keeping verbatim when TB is rebuilt: they pin the
// formula to K. Black's own printed worked examples and were the fix for a real
// bug (the app originally shipped Epley, which over-estimates).
// See docs/weight-math-audit.md.

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
