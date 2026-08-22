/**
 * The protocol layer: what a training programme IS, independent of any one
 * programme.
 *
 * This exists because the old shape could not express Tactical Barbell. The
 * removed `WaveWeek` was `{ week, pct, sets, reps }` — exactly one prescription
 * per week — which hardcoded the Operator assumption that every lifting day is
 * identical (docs/codebase-map.md §8.1). Grey Man breaks that twice over: each
 * day trains a different pair of main lifts, and each day carries TWO
 * prescriptions, one for the main lifts and one for the supplementary cluster
 * (MASS extraction p.51).
 *
 * Nothing in this file knows about a specific programme. `src/beginner.ts` and
 * the MASS protocols supply the data; `src/program.ts` holds the registry and
 * resolves a date to a session.
 *
 * See docs/mass-design.md §3.
 */
import type { Interval, SessionType } from './types'

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

/**
 * How a prescribed load is computed. These are genuinely different sums, not
 * variations of one formula — see docs/mass-design.md §4 and MASS p.90.
 */
export type Loading =
  /** Percentage of the basis max, loaded on a barbell. Needs plate math. */
  | { kind: 'barbell'; percent: number }
  /** Per-hand dumbbell load. The existing beginner mode carries no percentage. */
  | { kind: 'dumbbell'; percent?: number }
  /** The percentage applies to MAX REPS, not to weight (p.90). */
  | { kind: 'bodyweightReps'; percent: number }
  /** Weighted bodyweight — bodyweight must be inside the calculation (p.90). */
  | { kind: 'weightedBodyweight'; percent: number }
  /** No load prescribed: abs, mobility, a timed carry. */
  | { kind: 'unloaded' }

/**
 * What the percentage is a percentage OF.
 *
 * `tm90` exists for exactly one thing: the Bulgarian cluster, where the author
 * recommends a training maximum of 90% of the true 1RM "for both MS and MH
 * clusters" (MASS pp.88–89). It appears nowhere else in the book, so it belongs
 * to a CLUSTER, never to settings or to a phase — putting it higher up would
 * silently change every load in the app. Nothing sets it to `tm90` yet.
 */
export type LoadBasis = '1rm' | 'tm90'

// ---------------------------------------------------------------------------
// Prescription
// ---------------------------------------------------------------------------

/**
 * One cell of a programming grid: how many sets, of how many reps, at what load.
 *
 * `setsMin`/`setsMax` are a range because the book prints one — Grey Man's main
 * lifts are "4-5 x 8" (p.51). Where the book prints a single number, both fields
 * carry it.
 */
export interface Prescription {
  setsMin: number
  setsMax: number
  reps: number
  loading: Loading
  basis: LoadBasis
}

/** Convenience for the common case of a fixed set count. */
export const sets = (n: number, reps: number, loading: Loading, basis: LoadBasis = '1rm'): Prescription => ({
  setsMin: n,
  setsMax: n,
  reps,
  loading,
  basis,
})

/** A printed range, e.g. Grey Man's "4-5 x 8". */
export const setsRange = (
  min: number,
  max: number,
  reps: number,
  loading: Loading,
  basis: LoadBasis = '1rm',
): Prescription => ({ setsMin: min, setsMax: max, reps, loading, basis })

// ---------------------------------------------------------------------------
// Clusters
// ---------------------------------------------------------------------------

/**
 * An exercise inside a cluster.
 *
 * `id` is the key for everything — progress lookups, stored 1RMs, history
 * matching. It is deliberately NOT the display name: exercises used to be keyed
 * by name, and Josh's logged history already contains names that collide across
 * programmes ('DB Bench Press', '1-Arm DB Row', 'DB Romanian Deadlift').
 * Renaming an exercise must never break its history. See docs/mass-design.md §3.4.
 */
export interface ClusterExercise {
  id: string
  name: string
  /** Short label for tight UI (pills, week grid). */
  short?: string
  defaultLoading: Loading['kind']
}

export interface Cluster {
  id: string
  label: string
  exercises: ClusterExercise[]
  /**
   * Whether the user may change the exercise list. False for a book-fixed
   * cluster ("The Main cluster is standard across the board, the same for
   * everyone", p.48); true for one the book tells them to build (the Grey Man
   * S cluster, p.49).
   */
  editable: boolean
  /** Where the book defines this cluster, for the UI to cite. */
  sourceNote?: string
}

// ---------------------------------------------------------------------------
// Resolved plan shapes — what a screen actually renders
// ---------------------------------------------------------------------------

export interface PlannedSet {
  reps: number
  /** kg. Per dumbbell when `perDumbbell`, otherwise the total on the bar. */
  weight?: number
  perDumbbell?: boolean
  overCeiling?: boolean
  underFloor?: boolean
  /** Unrounded percentage target, so the UI can show it next to the loaded weight. */
  targetKg?: number
  /** Plates for one side of the bar, heaviest first. */
  perSide?: { kg: number; count: number }[]
  /** Target is lighter than the empty bar (MASS p.31 covers this for SE only). */
  belowBar?: boolean
}

export interface PlannedExercise {
  name: string
  /** Stable id; absent on legacy plans that predate the protocol layer. */
  exerciseId?: string
  note?: string
  loaded: boolean
  sets: PlannedSet[]
}

export interface SessionPlan {
  type: SessionType
  title: string
  scheme?: string
  detail?: string
  exercises: PlannedExercise[]
  /** Time-based run/walk intervals, if this session prescribes them. */
  intervals?: Interval[]
}

// ---------------------------------------------------------------------------
// Position
// ---------------------------------------------------------------------------

export interface BlockPosition {
  /** 1-based week within the block. */
  week: number
  /** 0=Mon..6=Sun. */
  day: number
  /**
   * 0-based index of this lifting session within the block, or -1 when today is
   * not a lifting day.
   *
   * This is what drives Grey Man's A/B alternation. The book prints it as a
   * two-week grid (p.50), which makes it look like week parity — it is not.
   * Written out as a sequence it is simply `A B A B A B A B A`: strict
   * alternation of consecutive lifting sessions, with the two-week period only a
   * side effect of three sessions running against a two-element cycle. Selecting
   * on day-of-week or on week parity both give the wrong answer.
   */
  liftingOrdinal: number
}

// ---------------------------------------------------------------------------
// Protocol
// ---------------------------------------------------------------------------

export type ProtocolFamily = 'general' | 'specificity' | 'base' | 'legacy'

/**
 * Which conditioning sessions pair with this protocol.
 *
 * "Use Green sessions when training General Mass blocks. Use Black with
 * Specificity" (MASS p.20). Conditioning is a property of the BLOCK, not of the
 * individual session.
 */
export type ConditioningColour = 'green' | 'black' | 'none'

export interface Protocol {
  id: string
  name: string
  family: ProtocolFamily
  /**
   * Length of one block in weeks. Grey Man is 3 ("Both General and Specificity
   * consist of 3-week blocks", p.40). Beginner is open-ended.
   */
  blockWeeks: number
  /** 0=Mon..6=Sun. Grey Man is [0, 2, 4] — Days 1/3/5, fixed (p.50). */
  liftingDays: number[]
  conditioning: ConditioningColour
  clusters: Record<string, Cluster>
  /**
   * Resolve one day to a session. This is the seam the old code lacked:
   * `sessionFor()` ignored its phase argument entirely and always delegated to
   * the one programme that existed.
   */
  sessionFor(pos: BlockPosition, settings: import('./types').Settings): SessionPlan
}

/** Every exercise this protocol can prescribe, across all its clusters. */
export function protocolExercises(p: Protocol): ClusterExercise[] {
  return Object.values(p.clusters).flatMap((c) => c.exercises)
}

/** Look up an exercise by id within a protocol. */
export function findExercise(p: Protocol, exerciseId: string): ClusterExercise | undefined {
  return protocolExercises(p).find((e) => e.id === exerciseId)
}
