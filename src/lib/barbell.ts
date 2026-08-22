/**
 * Barbell plate math.
 *
 * The MASS templates prescribe a percentage of a 1RM (e.g. Grey Man week 1 is
 * "4-5 x 8 / 70%", MASS extraction p.51). That produces an arbitrary number like
 * 68.3 kg, which no bar can hold. This module turns it into a weight you can
 * actually load, and tells you exactly which plates to put on.
 *
 * ── The rounding rule is OURS, not the book's ────────────────────────────────
 *
 * "Tactical Barbell: Mass Protocol" gives NO rounding rule anywhere in its 160
 * pages — no "round", no "nearest", no plate math, no bar weight. The one passage
 * that looks like guidance is scoped to Base Building's strength-endurance work
 * ("No need to get ultra-precise with your calculations. Get within the ballpark",
 * p.31) and is explicitly contrasted with maximal-strength training in the very
 * same paragraph, so it cannot be carried across. TB1's floor-rounding rule is a
 * different book and does not apply either.
 *
 * So we chose one, and it is recorded as a deviation in docs/mass-design.md §4:
 *
 *   Round to the NEAREST loadable weight. On an exact tie, round DOWN.
 *
 * Nearest rather than always-down because always-down systematically under-loads:
 * a 32 kg target on a 2.5 kg grid becomes 30 kg, 6% light on every single set.
 * Nearest bounds the error at half an increment and does not accumulate.
 *
 * Because the rule is ours, the deviation must stay VISIBLE. `LoadedBar` returns
 * the untouched `targetKg` alongside `totalKg` and the per-side breakdown so the
 * UI can always show the exact prescription next to what you actually load. Do
 * not "simplify" this by returning only the rounded number.
 */

/** Work in quarter-kilos so 1.25 and 0.5 kg plates are exact integers. */
const UNITS_PER_KG = 4

/**
 * One denomination of plate, counted in PAIRS (you load the bar symmetrically).
 * `pairs: undefined` means "as many as you like" — the common case for a home
 * gym where you will never approach the limit.
 */
export interface PlateStack {
  kg: number
  pairs?: number
}

export interface BarSetup {
  barKg: number
  /** Heaviest first is conventional but not required; the solver sorts. */
  plates: PlateStack[]
}

/**
 * Josh's kit (docs/mass-design.md §1): a 20 kg Olympic bar and standard kg
 * plates, giving a smallest bar jump of 2.5 kg. Add `{ kg: 0.5 }` if microplates
 * ever arrive — that takes the jump to 1 kg and is the only change needed.
 */
export const DEFAULT_BAR_SETUP: BarSetup = {
  barKg: 20,
  plates: [{ kg: 25 }, { kg: 20 }, { kg: 15 }, { kg: 10 }, { kg: 5 }, { kg: 2.5 }, { kg: 1.25 }],
}

export interface PlateCount {
  kg: number
  /** How many of this plate go on EACH side. */
  count: number
}

export interface LoadedBar {
  /** The exact percentage result, untouched. Always show this. */
  targetKg: number
  /** What you actually load. */
  totalKg: number
  /** `totalKg - targetKg`. Negative = lighter than prescribed. */
  deltaKg: number
  /** Plates for one side, heaviest first. Empty for an unloaded bar. */
  perSide: PlateCount[]
  /**
   * The target is lighter than the empty bar. The book addresses this only for
   * Base Building SE — "go ahead and use the empty bar", and if that is still too
   * heavy, "switch to dumbbells or another exercise" (p.31). It says nothing for
   * General Mass, so the app shows the empty bar and warns rather than silently
   * substituting an exercise (docs/mass-design.md §8.2).
   */
  belowBar: boolean
  /**
   * The plate inventory could not reach the target — you ran out of plates. The
   * bar is loaded as heavy as the inventory allows.
   */
  exhausted: boolean
}

const toUnits = (kg: number): number => Math.round(kg * UNITS_PER_KG)
const toKg = (units: number): number => units / UNITS_PER_KG

/**
 * Load a bar as close as possible to `targetKg`.
 *
 * Exact: solves for the reachable per-side weight nearest the target given the
 * available plates, rather than greedily stacking heaviest-first. Greedy would be
 * wrong with an irregular inventory — e.g. wanting 20 kg per side from 15s and
 * 10s, greedy takes a 15 and then cannot finish, while 10+10 is exact.
 */
export function loadBar(targetKg: number, setup: BarSetup = DEFAULT_BAR_SETUP): LoadedBar {
  const barKg = setup.barKg
  const bare: LoadedBar = {
    targetKg,
    totalKg: barKg,
    deltaKg: barKg - targetKg,
    perSide: [],
    belowBar: targetKg < barKg,
    exhausted: false,
  }

  // Nothing to add, or the target is under the empty bar. Either way you lift the
  // bar; `belowBar` tells the UI to say so.
  if (!Number.isFinite(targetKg) || targetKg <= barKg) return bare

  const plates = [...setup.plates].filter((p) => p.kg > 0).sort((a, b) => b.kg - a.kg)
  if (plates.length === 0) return { ...bare, exhausted: true }

  // How far per side we might need to search. Go one full plate beyond the target
  // so a heavier-but-nearer option is always in range.
  //
  // `wantUnits` is deliberately NOT rounded to the unit grid. A per-side target of
  // 9.375 kg sits exactly between the two loadable options either side of it, and
  // rounding it first would destroy that tie before the tie-breaker ever sees it —
  // turning a "round down" into a "round up".
  const wantUnits = ((targetKg - barKg) / 2) * UNITS_PER_KG
  const maxUnits = Math.ceil(wantUnits) + toUnits(plates[0].kg)

  // Bounded-knapsack reachability. `usedOfCurrent` carries how many of the plate
  // being processed were spent reaching a given sum, which is what enforces the
  // `pairs` cap; `from` records the plate that last landed on each sum so the
  // combination can be reconstructed.
  const reachable = new Uint8Array(maxUnits + 1)
  const from = new Int16Array(maxUnits + 1).fill(-1)
  reachable[0] = 1

  for (let i = 0; i < plates.length; i++) {
    const unit = toUnits(plates[i].kg)
    if (unit <= 0) continue
    const cap = plates[i].pairs ?? Math.ceil(maxUnits / unit)
    const usedOfCurrent = new Int32Array(maxUnits + 1)
    for (let s = unit; s <= maxUnits; s++) {
      if (reachable[s]) continue // already reachable without this plate — cheaper
      const prev = s - unit
      if (!reachable[prev]) continue
      if (usedOfCurrent[prev] >= cap) continue
      reachable[s] = 1
      usedOfCurrent[s] = usedOfCurrent[prev] + 1
      from[s] = i
    }
  }

  // Nearest reachable per-side sum; on an exact tie, prefer the lighter one.
  let bestUnits = 0
  let bestDelta = Number.POSITIVE_INFINITY
  for (let s = 0; s <= maxUnits; s++) {
    if (!reachable[s]) continue
    const delta = Math.abs(s - wantUnits)
    // Strict `<` keeps the first (lighter) candidate on a tie, since s ascends.
    if (delta < bestDelta) {
      bestDelta = delta
      bestUnits = s
    }
  }

  const perSide = reconstruct(bestUnits, from, plates)
  const totalKg = barKg + toKg(bestUnits) * 2
  return {
    targetKg,
    totalKg,
    deltaKg: round2(totalKg - targetKg),
    perSide,
    belowBar: false,
    // We only ran out if the best we could do is still short of the target.
    exhausted: bestUnits < wantUnits && bestUnits === maxReachableBelow(reachable, maxUnits),
  }
}

/** Walk the `from` pointers back to a plate list, heaviest first. */
function reconstruct(units: number, from: Int16Array, plates: PlateStack[]): PlateCount[] {
  const counts = new Map<number, number>()
  let s = units
  while (s > 0) {
    const i = from[s]
    if (i < 0) break // unreachable — should not happen for a reachable sum
    const kg = plates[i].kg
    counts.set(kg, (counts.get(kg) ?? 0) + 1)
    s -= toUnits(kg)
  }
  return [...counts.entries()]
    .map(([kg, count]) => ({ kg, count }))
    .sort((a, b) => b.kg - a.kg)
}

/** The heaviest per-side sum the inventory can reach at all. */
function maxReachableBelow(reachable: Uint8Array, maxUnits: number): number {
  for (let s = maxUnits; s >= 0; s--) if (reachable[s]) return s
  return 0
}

/** Kilos carry at most two decimals in practice; kill float noise. */
const round2 = (n: number): number => Math.round(n * 100) / 100

/**
 * A percentage of a 1RM, before rounding. Kept separate from `loadBar` so the
 * unrounded prescription is always available to display.
 */
export function targetLoad(oneRmKg: number, percent: number): number {
  return round2((oneRmKg * percent) / 100)
}

/**
 * Bodyweight movements: the percentage applies to MAX REPS, not to weight.
 *
 *   "If using just bodyweight – find your maximum number of REPS. Maximum reps act
 *    as your 1RM for bodyweight movements. Let's say you've included pull-ups in
 *    your cluster and you can do 10 max. If the programming calls for 3 sets x 10
 *    reps @ 70%RM, you'd do 3 sets of 7." (p.90)
 *
 * The book gives no rule for a fractional result, so we round nearest with ties
 * down, matching the weight rule above (docs/mass-design.md §8.3 — a deviation).
 * Never returns less than 1 rep.
 */
export function bodyweightReps(maxReps: number, percent: number): number {
  if (maxReps <= 0) return 0
  const raw = (maxReps * percent) / 100
  // Math.round rounds .5 up; negate to round half DOWN.
  const rounded = -Math.round(-raw)
  return Math.max(1, rounded)
}

/**
 * Weighted bodyweight (weighted pull-ups, weighted dips): bodyweight must be part
 * of the calculation, or the added weight climbs far too fast.
 *
 *   "If the movements are weighted – calculate normally as you would any other
 *    exercise but include your bodyweight in the calculation. If you don't include
 *    your bodyweight and just factor-in the external weight – things will get too
 *    heavy too fast. You've been warned." (p.90)
 *
 * `systemOneRmKg` is the 1RM of the whole system (bodyweight + any added weight).
 * Returns the weight to HANG ON YOU, which can be zero or negative — negative
 * means the prescription is lighter than your own bodyweight, so the movement
 * needs assistance or a substitute.
 */
export function weightedBodyweightAddedKg(
  systemOneRmKg: number,
  bodyweightKg: number,
  percent: number,
): number {
  return round2((systemOneRmKg * percent) / 100 - bodyweightKg)
}
