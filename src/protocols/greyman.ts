/**
 * Grey Man — the 3-day General Mass template.
 *
 * Everything here comes from "Tactical Barbell: Mass Protocol", pp.48–53, via
 * docs/MASS/MASS-extraction.md. Page references are PDF pages of that file.
 * The book wins: where it prints a number, that number is here verbatim, and
 * `test/greyman.test.ts` asserts the grid cell for cell.
 *
 *   "Grey Man is a versatile, efficient mass builder that uses a simple
 *    alternating 'A-B-A/B-A-B' style schedule." (p.48)
 */
import type { OneRmEntry, Settings } from '../types'
import {
  setsRange,
  type BlockPosition,
  type Cluster,
  type ClusterExercise,
  type PlannedExercise,
  type PlannedSet,
  type Prescription,
  type Protocol,
  type ProtocolContext,
  type SessionPlan,
} from '../protocol'
import {
  DEFAULT_BAR_SETUP,
  bodyweightReps,
  loadBar,
  targetLoad,
  weightedBodyweightAddedKg,
  type BarSetup,
} from '../lib/barbell'

// ---------------------------------------------------------------------------
// Clusters (pp.48–49)
// ---------------------------------------------------------------------------

/**
 * "GM contains two clusters – the Main cluster provided below, and a
 *  Supplementary (S) Cluster. The Main cluster is standard across the board, the
 *  same for everyone." (p.48)
 *
 * The p.48 image carries no substitution footnote, unlike the Mass Template's
 * cluster — so these four are fixed.
 */
export const GM_MAIN: ClusterExercise[] = [
  { id: 'bench', name: 'Bench Press', short: 'BP', defaultLoading: 'barbell' },
  { id: 'squat', name: 'Squat', short: 'SQ', defaultLoading: 'barbell' },
  { id: 'ohp', name: 'Overhead Press', short: 'OHP', defaultLoading: 'barbell' },
  { id: 'deadlift', name: 'Deadlift', short: 'DL', defaultLoading: 'barbell' },
]

/**
 * The book's own worked example of an S cluster (p.49 image, titled
 * "S CLUSTER (Example)"). It is explicitly an example, not a prescription —
 * "You create and customize the S cluster" (p.48) — so this is a starting point
 * the user replaces. The builder arrives in step 7 of docs/mass-design.md §9.
 *
 * Rules the builder must enforce (p.49):
 *   - 4 to 6 exercises in total, "no more than 4 to 6"
 *   - split into two lists, S1 and S2 (the book's example splits 3 / 2)
 *   - dumbbells, barbells, kettlebells and bodyweight all allowed
 */
export const GM_S1_EXAMPLE: ClusterExercise[] = [
  { id: 's_dips', name: 'Dips', defaultLoading: 'bodyweightReps' },
  { id: 's_incline_db_press', name: 'Incline Dumbbell Press', defaultLoading: 'dumbbell' },
  { id: 's_front_squat', name: 'Front Squat', defaultLoading: 'barbell' },
]
export const GM_S2_EXAMPLE: ClusterExercise[] = [
  { id: 's_db_shrugs', name: 'Dumbbell Shrugs', defaultLoading: 'dumbbell' },
  { id: 's_db_row', name: 'Dumbbell Row', defaultLoading: 'dumbbell' },
]

export const S_CLUSTER_MIN = 4
export const S_CLUSTER_MAX = 6

// ---------------------------------------------------------------------------
// The programming grid (p.51)
// ---------------------------------------------------------------------------

/**
 * Transcribed from the p.51 image. Every populated cell holds four stacked
 * lines: main sets×reps, main %, then S sets×reps and S % in bold. All three
 * lifting days in a week carry identical prescriptions.
 *
 * There are NO AMRAP and NO peaking markers anywhere in the Grey Man grid —
 * unlike Mass Template (p.45), Gladiator (p.55) and Fighter HT (p.60). Week 3 is
 * simply heavier. Do not add them here.
 *
 * `4-5 x` is a real printed range, not a typo; the user picks 4 or 5 sets.
 * Percentages are of the 1RM — Grey Man never uses a training max.
 */
export interface GreyManWeek {
  main: Prescription
  supp: Prescription
}

export const GM_GRID: Record<number, GreyManWeek> = {
  1: {
    main: setsRange(4, 5, 8, { kind: 'barbell', percent: 70 }),
    supp: setsRange(4, 4, 12, { kind: 'barbell', percent: 55 }),
  },
  2: {
    main: setsRange(4, 5, 6, { kind: 'barbell', percent: 75 }),
    supp: setsRange(4, 4, 10, { kind: 'barbell', percent: 60 }),
  },
  3: {
    main: setsRange(4, 5, 3, { kind: 'barbell', percent: 80 }),
    supp: setsRange(4, 4, 8, { kind: 'barbell', percent: 65 }),
  },
}

export const GM_BLOCK_WEEKS = 3

/**
 * Day 1 / Day 3 / Day 5 (p.50), mapped onto the app's 0=Mon..6=Sun convention.
 *
 * Fixed. Grey Man gives no permission to move them — that clause belongs to
 * Fighter HT's 48-hour rule (p.61) and Gladiator's "You don't have to stick to
 * the above schedule exactly" (p.55). Grey Man's own note about flexibility
 * (p.48) is about conditioning and recovery, not the lifting days.
 */
export const GM_LIFTING_DAYS = [0, 2, 4]

/** A = Bench + Squat + S1. B = Overhead Press + Deadlift + S2. (p.50) */
export type GreyManDay = 'A' | 'B'

/**
 * Which cluster today is.
 *
 * The book prints a THREE-week grid (p.50) — Week 1 `A B A`, Week 2 `B A B`,
 * Week 3 `A B A` — whose pattern repeats every two weeks, which reads like week
 * parity. It is not: written out as a sequence of lifting sessions it is
 * `A B A B A B A B A`, strict alternation, and the two-week period is only a side
 * effect of three sessions running against a two-element cycle.
 * See `BlockPosition.liftingOrdinal`.
 */
export function greyManDay(liftingOrdinal: number): GreyManDay {
  return liftingOrdinal % 2 === 0 ? 'A' : 'B'
}

/**
 * ⚠ THIS RULE ONLY ROTATES FOR AN ODD NUMBER OF LIFTING DAYS A WEEK.
 *
 * `liftingOrdinal` is `(week - 1) * liftingDays.length + indexOfDay`, so with an
 * EVEN weekly count the parity of a given weekday never changes: with two
 * lifting days, Monday is ordinal 0, 2, 4 … and is therefore Day A forever.
 * Grey Man has three (p.50), which is why the printed grid alternates Monday
 * week to week.
 *
 * This matters for Fighter HT, which trains twice a week (audit code-02 F13). It
 * is deliberately NOT "fixed" here: what Fighter HT should do instead is a
 * question for its own grid on p.60, and inventing an alternation rule before
 * reading that page is exactly the failure this rebuild exists to undo. The
 * property is pinned by a test so whoever builds it cannot miss it.
 */
export const alternationRotates = (liftingDaysPerWeek: number): boolean =>
  liftingDaysPerWeek % 2 === 1

const mainLiftsFor = (letter: GreyManDay): ClusterExercise[] =>
  letter === 'A'
    ? [GM_MAIN[0], GM_MAIN[1]] // Bench, Squat
    : [GM_MAIN[2], GM_MAIN[3]] // OHP, Deadlift

// ---------------------------------------------------------------------------
// Turning a prescription into sets
// ---------------------------------------------------------------------------

const barSetupFrom = (settings: Settings): BarSetup =>
  settings.bar?.platePairsKg?.length
    ? { barKg: settings.bar.barKg, plates: settings.bar.platePairsKg.map((kg) => ({ kg })) }
    : DEFAULT_BAR_SETUP

/** The number the percentage multiplies. `tm90` never fires for Grey Man. */
function basisKg(entry: OneRmEntry, basis: Prescription['basis']): number {
  const kg = entry.kg + (entry.progressedKg ?? 0)
  return basis === 'tm90' ? kg * 0.9 : kg
}

/**
 * Build the sets for one exercise. Returns a `PlannedExercise` with no weights
 * and an explanatory note when the 1RM is not known yet — better an honest gap
 * than a fabricated load.
 */
/**
 * Rest between sets, per cluster, from the book (p.52, p.53).
 *
 *   Main: "Rest for approximately 2-5 minutes or more in between sets."
 *   S:    "Rest for 1-2 minutes between sets."
 *
 * These are different numbers for different work, and the app used a flat 120 s
 * for both (audit book-01 F3).
 */
export const MAIN_REST_SEC = { min: 120, max: 300 } as const
export const SUPP_REST_SEC = { min: 60, max: 120 } as const

export function planExercise(
  ex: ClusterExercise,
  p: Prescription,
  ctx: ProtocolContext,
  rest: { min: number; max: number } = MAIN_REST_SEC,
): PlannedExercise {
  const entry = ctx.maxes[ex.id]
  const count = p.setsMin
  // Carried onto every returned shape below, so the session can offer the 5th
  // set the book prints (p.51) and rest the right amount (pp.52-53).
  const meta = {
    setsMin: p.setsMin,
    setsMax: p.setsMax,
    restSecMin: rest.min,
    restSecMax: rest.max,
  }
  const loading = { ...p.loading, kind: ex.defaultLoading } as Prescription['loading']
  const percent = 'percent' in p.loading ? (p.loading.percent ?? 0) : 0

  /** A gap on screen with the reason, rather than a fabricated load. */
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

  // The stored max carries the unit it was measured in. If the exercise's loading
  // kind has since been changed — the S-cluster builder allows exactly that — the
  // number means something different and MUST NOT be silently reinterpreted: a
  // 100 kg barbell 1RM read as per-dumbbell would prescribe 70 kg in each hand.
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
      // The percentage applies to MAX REPS, not to weight (p.90). A row with no
      // maxReps cannot produce a rep count — 0 reps is not a prescription.
      if (!entry.maxReps || entry.maxReps <= 0) {
        return unresolved(`Record your max reps for ${ex.name} — bodyweight work is a percentage of that (p.90).`)
      }
      // `loaded: false` below — there is no weight to record, and the session
      // screen was giving these a "Weight on the bar" kg field (audit code-03
      // F10). Weighted bodyweight is different: its added kg is a real load.
      set = { reps: bodyweightReps(entry.maxReps, percent) }
      break
    }
    case 'weightedBodyweight': {
      // Bodyweight MUST be part of the sum (p.90). Defaulting it to zero produces
      // precisely the "things will get too heavy too fast" failure the book warns
      // about — 70% of a 120 kg system max would hang 84 kg off a dip belt
      // instead of telling you that you need assistance.
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
      // Nearest, ties down — the same rule as the bar (docs/mass-design.md §4).
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
    // A bodyweight-reps prescription is a REP count, not a load (p.90).
    loaded: loading.kind !== 'bodyweightReps',
    ...meta,
    sets: Array.from({ length: count }, () => ({ ...set })),
  }
}

// ---------------------------------------------------------------------------
// Session resolution
// ---------------------------------------------------------------------------

const schemeLine = (w: GreyManWeek): string =>
  `${w.main.setsMin}–${w.main.setsMax} × ${w.main.reps} @ ${pct(w.main)}% · S ${w.supp.setsMin} × ${w.supp.reps} @ ${pct(w.supp)}%`

const pct = (p: Prescription): number => ('percent' in p.loading ? (p.loading.percent ?? 0) : 0)

/**
 * Execution notes, straight from the book (pp.50–53):
 *   - "The two main lifts of the day are performed first." (p.50)
 *   - Rest 2–5 min on main lifts, 1–2 min on S (p.53)
 *   - Super-setting is permitted for S exercises (p.53)
 */
const EXECUTION_DETAIL =
  'Main lifts first, then the supplementary cluster. Rest 2–5 min between main sets, 1–2 min on supplementary work (super-setting allowed). Failing reps? Lengthen the rest to 5 minutes or more FIRST — only drop that lift’s 1RM by 10% if you are still failing consistently (pp.52–53).'

export function greyManSessionFor(pos: BlockPosition, ctx: ProtocolContext): SessionPlan {
  if (pos.liftingOrdinal < 0) {
    // Green conditioning lands here in step 9 (docs/mass-design.md §5). Until
    // then a non-lifting day is a rest day rather than a fabricated session.
    return { type: 'rest', title: 'Rest', detail: 'Recovery is training too.', exercises: [] }
  }

  const week = Math.min(Math.max(pos.week, 1), GM_BLOCK_WEEKS)
  const grid = GM_GRID[week]
  const letter = greyManDay(pos.liftingOrdinal)
  const supp = letter === 'A' ? sClusterOf(ctx.settings, 's1') : sClusterOf(ctx.settings, 's2')

  const exercises: PlannedExercise[] = [
    ...mainLiftsFor(letter).map((ex) => planExercise(ex, grid.main, ctx, MAIN_REST_SEC)),
    // "The main cluster and supplementary cluster have separate structures"
    // (p.50) — including their rest intervals (p.53).
    ...supp.map((ex) => planExercise(ex, grid.supp, ctx, SUPP_REST_SEC)),
  ]

  return {
    type: 'lift',
    title: `Grey Man — Day ${letter}`,
    scheme: schemeLine(grid),
    detail: EXECUTION_DETAIL,
    exercises,
  }
}

/**
 * The user's S cluster if they have built one, otherwise the book's example.
 *
 * Exported because ANY screen that needs to know what the S cluster is must ask
 * this, not read `protocol.clusters`. The two disagree the moment the builder is
 * used, and `/maxes` reading the static default meant a custom exercise could
 * never be given a 1RM — it appeared in the session asking for a max that there
 * was nowhere to enter.
 */
export function sClusterOf(settings: Settings, which: 's1' | 's2'): ClusterExercise[] {
  const custom = settings.mass?.sCluster?.[which]
  if (custom?.length) return custom
  return which === 's1' ? GM_S1_EXAMPLE : GM_S2_EXAMPLE
}

/**
 * Every exercise this protocol will actually prescribe for a given user, main
 * cluster plus their live S cluster. This is what a maxes form must iterate.
 */
export function greyManExercises(settings: Settings): ClusterExercise[] {
  return [...GM_MAIN, ...sClusterOf(settings, 's1'), ...sClusterOf(settings, 's2')]
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const cluster = (id: string, label: string, exercises: ClusterExercise[], editable: boolean, note: string): Cluster => ({
  id,
  label,
  exercises,
  editable,
  sourceNote: note,
})

export const GREY_MAN_PROTOCOL: Protocol = {
  id: 'gm',
  name: 'Grey Man',
  family: 'general',
  // Shared with every other MASS general template — a bench 1RM is a bench 1RM.
  maxScope: 'mass',
  blockWeeks: GM_BLOCK_WEEKS,
  liftingDays: GM_LIFTING_DAYS,
  // "Use Green sessions when training General Mass blocks." (p.20)
  conditioning: 'green',
  clusters: {
    main: cluster('main', 'Main cluster', GM_MAIN, false, 'MASS p.48 — fixed, the same for everyone'),
    s1: cluster('s1', 'Supplementary S1', GM_S1_EXAMPLE, true, 'MASS p.49 — you build this (4–6 total, split S1/S2)'),
    s2: cluster('s2', 'Supplementary S2', GM_S2_EXAMPLE, true, 'MASS p.49 — you build this (4–6 total, split S1/S2)'),
  },
  exercisesFor: greyManExercises,
  sessionFor: greyManSessionFor,
}
