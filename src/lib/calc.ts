import type { DbIncrement, LoadBasis, MaxEntry } from '../types'

export const DB_MIN = 4
export const DB_MAX = 60

/**
 * Brzycki estimated 1RM from a submaximal set (per dumbbell). TB1 (3rd ed, p103)
 * says test a 3–5RM and plug it into a calculator; KB's own worked examples —
 * squat 375×5→422, bench 230×3→244 — are produced by Brzycki, NOT Epley, so we
 * match the book. Formula: 1RM = weight × 36 / (37 − reps) (guard reps < 37).
 */
export function estimate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  // Brzycki is only trustworthy for low-rep sets; past ~12 reps it inflates fast and
  // near reps=37 it blows up. Clamp the rep count so a high-rep set (e.g. a 15-rep
  // lateral raise) can't produce an absurd estimate.
  const r = Math.min(reps, 12)
  return (weight * 36) / (37 - r)
}

/** Training Max = 90% of true 1RM (TB standard). */
export function trainingMax(oneRM: number): number {
  return oneRM * 0.9
}

/** The basis load a phase computes its percentages from. */
export function basisMax(oneRM: number, basis: LoadBasis): number {
  return basis === 'tm' ? trainingMax(oneRM) : oneRM
}

export interface LoadResult {
  /** kg per dumbbell, floor-rounded to the increment and clamped 4–60 */
  kg: number
  /** raw unrounded target (kg per dumbbell) */
  raw: number
  /** true if the true target exceeds the 60kg dumbbell ceiling */
  overCeiling: boolean
  /** true if clamped up to the 4kg floor */
  underFloor: boolean
}

/**
 * Working load for one lift at a given percentage.
 * TB rule: loads are FLOOR-rounded down to the dumbbell increment (never round up),
 * then clamped to the 4–60 kg per-dumbbell range.
 */
export function workingLoad(
  basisMaxPerDb: number,
  pct: number,
  increment: DbIncrement,
  ceiling: number = DB_MAX,
): LoadResult {
  const cap = ceiling > 0 ? ceiling : DB_MAX
  const raw = (basisMaxPerDb * pct) / 100
  let kg = Math.floor(raw / increment) * increment
  const overCeiling = raw > cap
  const underFloor = kg < DB_MIN
  kg = Math.max(DB_MIN, Math.min(cap, kg))
  return { kg, raw, overCeiling, underFloor }
}

/** Effective 1RM per DB = tested estimate + any forced-progression bump. */
export function effective1RM(entry: MaxEntry): number {
  return estimate1RM(entry.testWeight, entry.testReps) + (entry.bumpKg ?? 0)
}

/** Convenience: from a tested max entry to the phase basis max (per DB). */
export function maxToBasis(entry: MaxEntry, basis: LoadBasis): number {
  return basisMax(effective1RM(entry), basis)
}
