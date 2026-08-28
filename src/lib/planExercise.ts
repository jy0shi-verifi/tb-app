/**
 * Turn a prescription + a stored 1RM into the sets a session actually shows.
 *
 * Shared by every MASS template. Grey Man, Alpha and Bravo all load the same
 * four ways (barbell / dumbbell / bodyweight-reps / weighted bodyweight) and
 * the same unit trap (per-dumbbell vs total-on-the-bar) produced four bugs
 * when a call site rolled its own version.
 */
import type { OneRmEntry } from '../types'
import type { ClusterExercise, PlannedExercise, PlannedSet, Prescription, ProtocolContext } from '../protocol'
import {
  DEFAULT_BAR_SETUP,
  bodyweightReps,
  loadBar,
  targetLoad,
  weightedBodyweightAddedKg,
  type BarSetup,
} from './barbell'
import type { Settings } from '../types'

/** Grey Man main / Alpha MS (p.52, p.75): 2–5 minutes. */
export const MAIN_REST_SEC = { min: 120, max: 300 } as const
/** Grey Man S / Alpha H / Bravo (p.53, p.82): 1–2 minutes. */
export const SUPP_REST_SEC = { min: 60, max: 120 } as const

const barSetupFrom = (settings: Settings): BarSetup =>
  settings.bar?.platePairsKg?.length
    ? { barKg: settings.bar.barKg, plates: settings.bar.platePairsKg.map((kg) => ({ kg })) }
    : DEFAULT_BAR_SETUP

/** The number the percentage multiplies. `tm90` is for the Bulgarian cluster only. */
export function basisKg(entry: OneRmEntry, basis: Prescription['basis']): number {
  const kg = entry.kg + (entry.progressedKg ?? 0)
  return basis === 'tm90' ? kg * 0.9 : kg
}

export function planExercise(
  ex: ClusterExercise,
  p: Prescription,
  ctx: ProtocolContext,
  rest: { min: number; max: number } = MAIN_REST_SEC,
): PlannedExercise {
  const entry = ctx.maxes[ex.id]
  const count = p.setsMin
  const meta = {
    setsMin: p.setsMin,
    setsMax: p.setsMax,
    restSecMin: rest.min,
    restSecMax: rest.max,
  }
  const loading = { ...p.loading, kind: ex.defaultLoading } as Prescription['loading']
  const percent = 'percent' in p.loading ? (p.loading.percent ?? 0) : 0

  const unresolved = (note: string): PlannedExercise => ({
    name: ex.name,
    exerciseId: ex.id,
    loaded: true,
    note,
    ...meta,
    sets: Array.from({ length: count }, () => ({ reps: p.reps })),
  })

  if (loading.kind === 'unloaded') {
    return {
      name: ex.name,
      exerciseId: ex.id,
      loaded: false,
      ...meta,
      sets: Array.from({ length: count }, () => ({ reps: p.reps })),
    }
  }

  if (!entry) return unresolved(`Set your 1RM for ${ex.name} to see the working weight (${percent}%).`)

  const wantsPerDumbbell = loading.kind === 'dumbbell'
  const isPerDumbbell = entry.unit === 'perDumbbell'
  const usesWeight = loading.kind === 'dumbbell' || loading.kind === 'barbell'
  if (usesWeight && wantsPerDumbbell !== isPerDumbbell) {
    return unresolved(
      `${ex.name}'s 1RM was recorded ${isPerDumbbell ? 'per dumbbell' : 'as a barbell total'} but it is now set up as ${wantsPerDumbbell ? 'a dumbbell' : 'a barbell'} lift. Re-test it to see a weight.`,
    )
  }

  let set: PlannedSet

  switch (loading.kind) {
    case 'bodyweightReps': {
      if (!entry.maxReps || entry.maxReps <= 0) {
        return unresolved(`Record your max reps for ${ex.name} — bodyweight work is a percentage of that (p.90).`)
      }
      set = { reps: bodyweightReps(entry.maxReps, percent) }
      break
    }
    case 'weightedBodyweight': {
      const bw = ctx.settings.bodyweightKg
      if (!bw || bw <= 0) {
        return unresolved(`Set your bodyweight in Settings — it has to be part of the sum for ${ex.name} (p.90).`)
      }
      const added = weightedBodyweightAddedKg(basisKg(entry, p.basis), bw, percent)
      set = { reps: p.reps, weight: Math.max(0, added), targetKg: added, underFloor: added < 0 }
      break
    }
    case 'dumbbell': {
      const raw = targetLoad(basisKg(entry, p.basis), percent)
      const step = ctx.settings.dbIncrement || 2
      const kg = -Math.round(-raw / step) * step
      set = { reps: p.reps, weight: kg, perDumbbell: true, targetKg: raw }
      break
    }
    default: {
      const raw = targetLoad(basisKg(entry, p.basis), percent)
      const bar = loadBar(raw, barSetupFrom(ctx.settings))
      set = {
        reps: p.reps,
        weight: bar.totalKg,
        targetKg: bar.targetKg,
        perSide: bar.perSide,
        belowBar: bar.belowBar,
        exhausted: bar.exhausted,
      }
      break
    }
  }

  return {
    name: ex.name,
    exerciseId: ex.id,
    loaded: loading.kind !== 'bodyweightReps',
    ...meta,
    sets: Array.from({ length: count }, () => ({ ...set })),
  }
}
