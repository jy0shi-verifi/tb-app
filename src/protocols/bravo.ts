/**
 * Specificity Bravo — four days of hypertrophy, MASS pp.80–83.
 *
 * The p.81 grid waves load *inside* the week: Day 4/5 are 5 percentage points
 * heavier than Day 1/2 at the same sets × reps. That bump is the easy wrong
 * answer `test/bravo.test.ts` pins.
 */
import type { Settings } from '../types'
import {
  setsRange,
  type BlockPosition,
  type Cluster,
  type ClusterExercise,
  type Prescription,
  type Protocol,
  type ProtocolContext,
  type SessionPlan,
} from '../protocol'
import { SUPP_REST_SEC, planExercise } from '../lib/planExercise'
import {
  H1_EXAMPLE,
  H2_EXAMPLE,
  SPEC_BLOCK_WEEKS,
  SPEC_LIFTING_DAYS,
  hClusterOf,
  specExercises,
} from './specificity'

export interface BravoWeek {
  early: Prescription
  late: Prescription
}

export const BRAVO_GRID: Record<number, BravoWeek> = {
  1: {
    early: setsRange(4, 5, 12, { kind: 'barbell', percent: 50 }),
    late: setsRange(4, 5, 12, { kind: 'barbell', percent: 55 }),
  },
  2: {
    early: setsRange(4, 5, 10, { kind: 'barbell', percent: 60 }),
    late: setsRange(4, 5, 10, { kind: 'barbell', percent: 65 }),
  },
  3: {
    early: setsRange(4, 5, 8, { kind: 'barbell', percent: 70 }),
    late: setsRange(4, 5, 8, { kind: 'barbell', percent: 75 }),
  },
}

export type BravoSlot = 'h1' | 'h2'

export function bravoSlot(day: number): BravoSlot | null {
  if (day === 0 || day === 3) return 'h1'
  if (day === 1 || day === 4) return 'h2'
  return null
}

/** Day 4 and 5 (Thu/Fri) take the heavier cell of the week (p.81). */
export function bravoLateWeek(day: number): boolean {
  return day === 3 || day === 4
}

const pct = (p: Prescription): number => ('percent' in p.loading ? (p.loading.percent ?? 0) : 0)

const EXECUTION =
  'All sets of one exercise before the next (unless super-setting). Rest 1–2 min, stay under 2 if you can. Failure near the end of a set is expected — rest briefly and make up the reps (p.82). Extra sets, last-set failure at the same load, and super-sets are optional (pp.82–83). Do not run the same compound on consecutive Bravo days (p.85).'

export function bravoSessionFor(pos: BlockPosition, ctx: ProtocolContext): SessionPlan {
  const slot = bravoSlot(pos.day)
  if (slot == null) {
    return { type: 'rest', title: 'Rest', detail: 'Black conditioning lives on non-lifting days (p.99).', exercises: [] }
  }

  const weekN = Math.min(Math.max(pos.week, 1), SPEC_BLOCK_WEEKS)
  const grid = BRAVO_GRID[weekN]
  const rx = bravoLateWeek(pos.day) ? grid.late : grid.early
  const exercises = hClusterOf(ctx.settings, slot).map((ex) => planExercise(ex, rx, ctx, SUPP_REST_SEC))

  return {
    type: 'lift',
    title: slot === 'h1' ? 'Bravo — H1' : 'Bravo — H2',
    scheme: `${rx.setsMin}–${rx.setsMax} × ${rx.reps} @ ${pct(rx)}%`,
    detail: EXECUTION,
    exercises,
  }
}

export function bravoExercises(settings: Settings): ClusterExercise[] {
  return specExercises(settings, false)
}

const cluster = (id: string, label: string, exercises: ClusterExercise[], editable: boolean, note: string): Cluster => ({
  id,
  label,
  exercises,
  editable,
  sourceNote: note,
})

export const BRAVO_PROTOCOL: Protocol = {
  id: 'bravo',
  name: 'Specificity Bravo',
  family: 'specificity',
  maxScope: 'mass',
  blockWeeks: SPEC_BLOCK_WEEKS,
  liftingDays: SPEC_LIFTING_DAYS,
  conditioning: 'black',
  clusters: {
    h1: cluster('h1', 'Hypertrophy H1', H1_EXAMPLE, true, 'MASS p.80 — 8–16 exercises, split H1/H2, each twice a week'),
    h2: cluster('h2', 'Hypertrophy H2', H2_EXAMPLE, true, 'MASS p.80 — 8–16 exercises, split H1/H2, each twice a week'),
  },
  exercisesFor: bravoExercises,
  sessionFor: bravoSessionFor,
}
