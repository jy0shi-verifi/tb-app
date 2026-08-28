/**
 * Shared Specificity cluster defaults — H clusters work with Alpha or Bravo
 * unless the book says otherwise (p.85). One stored H cluster, both protocols
 * read it.
 */
import type { Settings } from '../types'
import type { ClusterExercise } from '../protocol'
import { GM_MAIN } from './greyman'

/** Day 1 / 2 / 4 / 5 (p.70, p.80) → Mon / Tue / Thu / Fri. */
export const SPEC_LIFTING_DAYS = [0, 1, 3, 4]

export const SPEC_BLOCK_WEEKS = 3

/** Standard Alpha MS cluster (p.71). Same ids as Grey Man so 1RMs carry. */
export const ALPHA_MS_STANDARD: ClusterExercise[] = [
  GM_MAIN[0], // bench
  GM_MAIN[1], // squat
  GM_MAIN[3], // deadlift
]

/**
 * Bravo's own example cluster (p.81 image). 5 + 6 = 11, inside 8–16.
 * Where the lift is one Grey Man already names, reuse that id so the 1RM carries.
 */
export const H1_EXAMPLE: ClusterExercise[] = [
  { id: 'bench', name: 'Bench Press', short: 'BP', defaultLoading: 'barbell', bodyPart: 'upper' },
  { id: 'h_db_military_press', name: 'Dumbbell Military Press', defaultLoading: 'dumbbell', bodyPart: 'upper' },
  { id: 's_dips', name: 'Dips', defaultLoading: 'bodyweightReps', bodyPart: 'upper' },
  { id: 's_front_squat', name: 'Front Squat', defaultLoading: 'barbell', bodyPart: 'lower' },
  { id: 'h_ab_rollout', name: 'Ab Roll-out', defaultLoading: 'unloaded', bodyPart: 'upper' },
]

export const H2_EXAMPLE: ClusterExercise[] = [
  { id: 'h_barbell_row', name: 'Barbell Row', defaultLoading: 'barbell', bodyPart: 'upper' },
  { id: 'h_bicep_curls', name: 'Bicep Curls', defaultLoading: 'dumbbell', bodyPart: 'upper' },
  { id: 's_db_shrugs', name: 'Dumbbell Shrugs', defaultLoading: 'dumbbell', bodyPart: 'upper' },
  { id: 'h_rdl', name: 'Romanian Deadlift', defaultLoading: 'barbell', bodyPart: 'lower' },
  { id: 'h_face_pulls', name: 'Face Pulls', defaultLoading: 'dumbbell', bodyPart: 'upper' },
  { id: 'h_hyperextensions', name: 'Hyperextensions (Back)', defaultLoading: 'unloaded', bodyPart: 'lower' },
]

export const H_CLUSTER_MIN_ALPHA = 6
export const H_CLUSTER_MAX_ALPHA = 12
export const H_CLUSTER_MIN_BRAVO = 8
export const H_CLUSTER_MAX_BRAVO = 16

/** Conventional deadlift only — trap-bar / RDL use the normal MS scheme (p.75). */
export const isConventionalDeadlift = (ex: ClusterExercise): boolean => ex.id === 'deadlift'

export function msClusterOf(settings: Settings): ClusterExercise[] {
  const custom = settings.mass?.msCluster
  if (custom?.length) return custom
  return ALPHA_MS_STANDARD
}

export function hClusterOf(settings: Settings, which: 'h1' | 'h2'): ClusterExercise[] {
  const custom = settings.mass?.hCluster?.[which]
  if (custom?.length) return custom
  return which === 'h1' ? H1_EXAMPLE : H2_EXAMPLE
}

export function specExercises(settings: Settings, includeMs: boolean): ClusterExercise[] {
  const h = [...hClusterOf(settings, 'h1'), ...hClusterOf(settings, 'h2')]
  if (!includeMs) return h
  const seen = new Set(h.map((e) => e.id))
  const ms = msClusterOf(settings).filter((e) => !seen.has(e.id))
  return [...ms, ...h]
}

/** Same id in H1 and H2 → Bravo would hit that lift on consecutive days (p.85). */
export function hClusterOverlapIds(settings: Settings): string[] {
  const a = new Set(hClusterOf(settings, 'h1').map((e) => e.id))
  return hClusterOf(settings, 'h2')
    .filter((e) => a.has(e.id))
    .map((e) => e.id)
}

export const deadliftPerWeek = (settings: Settings): 1 | 2 =>
  settings.mass?.deadliftPerWeek === 1 ? 1 : 2
