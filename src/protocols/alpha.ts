/**
 * Specificity Alpha — mixed maximal-strength / hypertrophy, MASS pp.67–79.
 *
 * The printed p.74 grid wins over the p.70 prose ("3-5 repetitions"): week 1 MS
 * is 3 × 6 @ 75%, not 3–5 reps. `test/alpha.test.ts` asserts the grid cell for
 * cell, including the deadlift override.
 */
import type { Settings } from '../types'
import {
  sets,
  type BlockPosition,
  type Cluster,
  type ClusterExercise,
  type PlannedExercise,
  type Prescription,
  type Protocol,
  type ProtocolContext,
  type SessionPlan,
} from '../protocol'
import { MAIN_REST_SEC, SUPP_REST_SEC, planExercise } from '../lib/planExercise'
import {
  ALPHA_MS_STANDARD,
  H1_EXAMPLE,
  H2_EXAMPLE,
  SPEC_BLOCK_WEEKS,
  SPEC_LIFTING_DAYS,
  deadliftPerWeek,
  hClusterOf,
  isConventionalDeadlift,
  msClusterOf,
  specExercises,
} from './specificity'

export interface AlphaWeek {
  ms: Prescription
  /** Deadlift: 1 work set, different reps from the other MS lifts (p.74). */
  dl: Prescription
  h: Prescription
}

export const ALPHA_GRID: Record<number, AlphaWeek> = {
  1: {
    ms: sets(3, 6, { kind: 'barbell', percent: 75 }),
    dl: sets(1, 5, { kind: 'barbell', percent: 75 }),
    h: sets(4, 12, { kind: 'barbell', percent: 65 }),
  },
  2: {
    ms: sets(3, 5, { kind: 'barbell', percent: 80 }),
    dl: sets(1, 4, { kind: 'barbell', percent: 80 }),
    h: sets(4, 10, { kind: 'barbell', percent: 70 }),
  },
  3: {
    ms: sets(3, 3, { kind: 'barbell', percent: 85 }),
    dl: sets(1, 3, { kind: 'barbell', percent: 85 }),
    h: sets(4, 8, { kind: 'barbell', percent: 75 }),
  },
}

export type AlphaSlot = 'ms' | 'h1' | 'h2'

/** Default map: Day 1 MS, Day 2 H1, Day 4 MS, Day 5 H2 (p.70, p.72). */
export function alphaSlot(day: number): AlphaSlot | null {
  if (day === 0 || day === 3) return 'ms'
  if (day === 1) return 'h1'
  if (day === 4) return 'h2'
  return null
}

const pct = (p: Prescription): number => ('percent' in p.loading ? (p.loading.percent ?? 0) : 0)

const EXECUTION_MS =
  'Slow and relaxed. Rest 2–5 min (3–5 on heavier days). Avoid failure — the last rep should be as crisp as the first (p.75). Deadlifts are one work set; you can run them once or twice a week (pp.74–75).'

const EXECUTION_H =
  'H days: 1–2 min rest. Residual fatigue is fine. Extra sets, last-set failure (same load) and super-sets are optional tactics (pp.76–77, p.82).'

function planMsLifts(week: AlphaWeek, ctx: ProtocolContext, firstMsOfWeek: boolean): PlannedExercise[] {
  const cluster = msClusterOf(ctx.settings)
  const twice = deadliftPerWeek(ctx.settings) === 2
  const includeDl = twice || firstMsOfWeek
  return cluster.flatMap((ex) => {
    if (isConventionalDeadlift(ex)) {
      if (!includeDl) return []
      return [planExercise(ex, week.dl, ctx, MAIN_REST_SEC)]
    }
    return [planExercise(ex, week.ms, ctx, MAIN_REST_SEC)]
  })
}

export function alphaSessionFor(pos: BlockPosition, ctx: ProtocolContext): SessionPlan {
  const slot = alphaSlot(pos.day)
  if (slot == null) {
    return { type: 'rest', title: 'Rest', detail: 'Stay fresh for MS days — no H the day before MS (p.73).', exercises: [] }
  }

  const weekN = Math.min(Math.max(pos.week, 1), SPEC_BLOCK_WEEKS)
  const grid = ALPHA_GRID[weekN]

  if (slot === 'ms') {
    const firstMs = pos.day === 0
    const exercises = planMsLifts(grid, ctx, firstMs)
    return {
      type: 'lift',
      title: 'Alpha — MS',
      scheme: `${grid.ms.setsMin} × ${grid.ms.reps} @ ${pct(grid.ms)}% · DL ${grid.dl.setsMin} × ${grid.dl.reps}`,
      detail: EXECUTION_MS,
      exercises,
    }
  }

  const which = slot === 'h1' ? 'h1' : 'h2'
  const exercises = hClusterOf(ctx.settings, which).map((ex) => planExercise(ex, grid.h, ctx, SUPP_REST_SEC))
  return {
    type: 'lift',
    title: slot === 'h1' ? 'Alpha — H1' : 'Alpha — H2',
    scheme: `${grid.h.setsMin} × ${grid.h.reps} @ ${pct(grid.h)}%`,
    detail: EXECUTION_H,
    exercises,
  }
}

export function alphaExercises(settings: Settings): ClusterExercise[] {
  return specExercises(settings, true)
}

const cluster = (id: string, label: string, exercises: ClusterExercise[], editable: boolean, note: string): Cluster => ({
  id,
  label,
  exercises,
  editable,
  sourceNote: note,
})

export const ALPHA_PROTOCOL: Protocol = {
  id: 'alpha',
  name: 'Specificity Alpha',
  family: 'specificity',
  maxScope: 'mass',
  blockWeeks: SPEC_BLOCK_WEEKS,
  liftingDays: SPEC_LIFTING_DAYS,
  conditioning: 'black',
  clusters: {
    ms: cluster('ms', 'MS cluster', ALPHA_MS_STANDARD, true, 'MASS p.71 — press, pull, legs; you may build your own'),
    h1: cluster('h1', 'Hypertrophy H1', H1_EXAMPLE, true, 'MASS pp.71–72 — 6–12 exercises, split H1/H2'),
    h2: cluster('h2', 'Hypertrophy H2', H2_EXAMPLE, true, 'MASS pp.71–72 — 6–12 exercises, split H1/H2'),
  },
  exercisesFor: alphaExercises,
  sessionFor: alphaSessionFor,
}
