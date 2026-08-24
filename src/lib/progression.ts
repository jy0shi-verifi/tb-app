/**
 * Forced Progression — MASS pp.47, 53, 57, 62, 77, 83, 90.
 *
 * The book prints the rule verbatim at the end of every template chapter:
 *
 *   "Every 3 to 6 weeks, add 5-10lbs to 1RMs. Recalculate and repeat. Don't
 *    force progression for exercises you struggled with - use the same numbers
 *    for the next block." (p.53)
 *
 * and names it at p.90:
 *
 *   "There's no need to regularly test your 1 rep maximums with this protocol.
 *    Test as required when changing phases or incorporating new exercises. From
 *    there on progression simply consists of adding weight to your 1 rep maximum
 *    and recalculating from block to block. Also referred to as Forced
 *    Progression in the Tactical Barbell system." (p.90)
 *
 * So the stored 1RM is a number that DRIFTS, not a test result that is
 * periodically refreshed — see the extraction's cross-chapter reconciliation §2.
 * Until this module existed nothing in `src/` wrote a non-zero `progressedKg`,
 * which meant block 4 prescribed exactly what block 1 did. Three of the eight
 * audits found that independently; it is audit finding A1.
 *
 * Everything here is pure. Persistence lives in `src/screens/Progression.tsx`,
 * boundary detection in `src/program.ts`.
 */
import type { ClusterExercise } from '../protocol'
import type { OneRmEntry, SessionLog } from '../types'

// ---------------------------------------------------------------------------
// The increment
// ---------------------------------------------------------------------------

/**
 * The book's increment is "5-10lbs" (p.53), and the book is in pounds
 * throughout — it never mentions kilograms on any of its 160 pages. Converted:
 *
 *   5 lb  = 2.268 kg   →  we use 2.5 kg (5.51 lb)
 *   10 lb = 4.536 kg   →  we use 4.5 kg (9.92 lb)
 *
 * Round kg numbers, both effectively at the bounds of the printed range. The
 * increment lands on the STORED 1RM, never on a bar, so it does not have to be
 * plate-friendly.
 */
export const PROGRESSION_MIN_KG = 2.5
export const PROGRESSION_MAX_KG = 4.5

/**
 * Which end of the range a lift gets — **DEVIATION**, see docs/mass-design.md §12.
 *
 * Mass Protocol prints "add 5-10lbs to 1RMs" six times (pp.47, 53, 57, 62, 77,
 * 83) and NEVER says which lifts take which end. The extraction recorded that
 * silence twice, and a search of the author's own forum found no guidance
 * either — only community members, none of whom distinguish upper from lower.
 *
 * But **Tactical Barbell I does say it**, for the same author's Forced
 * Progression under Operator: *5 lb to upper body lifts (Bench Press, Pull Up)
 * and 10 lb to lower body lifts (Squat, Deadlift)*. MASS's range is exactly
 * those two numbers, so this reads as the author stating the bounds of a rule he
 * had already published rather than inventing a new undifferentiated one.
 *
 * That makes the split the most probable reading of the range — but it is our
 * inference, not this book's text, so it is labelled a deviation.
 *
 * **Absent `bodyPart` means the SMALLER increment.** A user-built S exercise we
 * know nothing about should progress conservatively, not aggressively.
 */
export const incrementForKg = (bodyPart?: 'upper' | 'lower'): number =>
  bodyPart === 'lower' ? PROGRESSION_MAX_KG : PROGRESSION_MIN_KG

/**
 * The default, kept for the UI's copy and for anything without an exercise to
 * hand. The low end on purpose: "Whatever you do, DON'T start too heavy or
 * overestimate your 1RMs" (p.64).
 */
export const PROGRESSION_DEFAULT_KG = PROGRESSION_MIN_KG

/**
 * Grey Man's failure remedy is a flat **10%** (p.53). The Mass Template says
 * 5-10% for the same situation (p.45) and the FAQ says 5-10% (p.152) — genuinely
 * different numbers in the book, not a transcription slip. The figure therefore
 * belongs to a protocol rather than to this module; Grey Man's is named here
 * because Grey Man is what is built.
 */
export const GM_FAILURE_DROP_PCT = 10

// ---------------------------------------------------------------------------
// Reading and moving a max
// ---------------------------------------------------------------------------

/**
 * What the percentages are actually applied to: the tested number plus every
 * increment since. `basisKg` in `greyman.ts` computes the same sum; this is the
 * name for it outside the loading path.
 */
export const currentMaxKg = (entry: OneRmEntry): number => entry.kg + (entry.progressedKg ?? 0)

/** Round to 0.1 kg so repeated moves cannot accumulate float dust in the store. */
const round1 = (n: number): number => Math.round(n * 10) / 10

/**
 * Add one increment. The tested figure in `kg` is never touched — the drift
 * accumulates in `progressedKg` so the UI can honestly say "tested 100, now 105"
 * and so a re-test can reset the drift cleanly rather than having to unpick it.
 */
export function withProgression(entry: OneRmEntry, addKg: number): OneRmEntry {
  return { ...entry, progressedKg: round1((entry.progressedKg ?? 0) + addKg) }
}

/**
 * The failure remedy: "lower your 1 rep maximum by 10% and recalculate" (p.53).
 *
 * Applied to the CURRENT max, not to the tested one. The book says to lower
 * "your 1 rep maximum", which after any progression is the drifted number;
 * taking 10% off the original test instead would silently undo more than 10%.
 *
 * The result is written back into `progressedKg`, which therefore goes negative.
 * That is deliberate: `kg` stays the number he actually lifted on the day he
 * tested it, so a re-test still has something to compare against.
 */
export function withFailureDrop(entry: OneRmEntry, pct: number = GM_FAILURE_DROP_PCT): OneRmEntry {
  const target = currentMaxKg(entry) * (1 - pct / 100)
  return { ...entry, progressedKg: round1(target - entry.kg) }
}

// ---------------------------------------------------------------------------
// "Don't force progression for exercises you struggled with" (p.53)
// ---------------------------------------------------------------------------

/**
 * Sessions belonging to one block: `[startDate, endDateExclusive)`.
 *
 * Dates are compared as ISO strings, which sorts correctly and — unlike
 * `Date.parse` on a date string — cannot drift a day across a DST boundary.
 */
export function sessionsInBlock(
  sessions: SessionLog[],
  startDate: string,
  endDateExclusive: string,
): SessionLog[] {
  return sessions.filter((s) => s.date >= startDate && s.date < endDateExclusive)
}

/**
 * How many logged sets of this exercise fell short within the block.
 *
 * Grey Man prescribes the SAME rep count for every set of an exercise in a
 * session (p.51), so a set logged below the best set of its own session is one
 * that was cut short. That needs no stored prescription and no schema change —
 * it reads what is already in the log.
 *
 * Deliberately a HINT, not the decision. The book's test is the lifter's
 * judgement ("exercises you struggled with"), not a rep threshold, and a session
 * cut short uniformly is invisible to this. The explicit marker below is the
 * mechanism; this is the reminder that sits next to it.
 *
 * Matched by exercise NAME because that is what `LoggedExercise` carries.
 */
export function shortSetsInBlock(blockSessions: SessionLog[], exerciseName: string): number {
  let short = 0
  for (const s of blockSessions) {
    for (const e of s.exercises) {
      if (e.name !== exerciseName) continue
      const best = e.sets.reduce((n, set) => Math.max(n, set.reps), 0)
      if (best <= 0) continue
      short += e.sets.filter((set) => set.reps < best).length
    }
  }
  return short
}

/**
 * Whether the lifter marked this exercise a struggle anywhere in the block.
 *
 * `LoggedExercise.struggled` is the book's own criterion made explicit: the
 * lifter decides what was a struggle, so the app asks rather than inferring. One
 * tap anywhere in the block is enough — the rule is about the block, not about a
 * single session.
 */
export function markedStruggled(blockSessions: SessionLog[], exerciseName: string): boolean {
  return blockSessions.some((s) => s.exercises.some((e) => e.name === exerciseName && e.struggled))
}

// ---------------------------------------------------------------------------
// The candidate list the prompt renders
// ---------------------------------------------------------------------------

export interface ProgressionCandidate {
  exerciseId: string
  exerciseName: string
  entry: OneRmEntry
  /** kg + progressedKg — what the percentages currently multiply. */
  currentKg: number
  /** True when the lifter ticked "struggled" on this lift during the block. */
  struggled: boolean
  /** Sets logged below the best set of their own session, across the block. */
  shortSets: number
  /**
   * The full increment this lift would take on a clean block, sized by
   * `bodyPart` — 4.5 kg lower body, 2.5 kg upper (`incrementForKg`).
   */
  fullKg: number
  /**
   * Why this lift cannot take a kg increment, if it cannot. A bodyweight-reps
   * exercise has no load to add to — its 1RM stands in as a MAX REPS figure
   * (p.90) and the book gives no rep-increment rule on any page, so the app must
   * not invent one. Those progress by re-testing max reps.
   */
  blocked?: string
}

export interface ProgressionReview {
  candidates: ProgressionCandidate[]
  /** Prescribed exercises with no 1RM recorded yet, so the prompt can say so. */
  missing: string[]
}

/**
 * Everything the block-boundary prompt needs, for one protocol's exercise list.
 *
 * `maxes` must already be narrowed to the protocol's `maxScope` — a protocol
 * never sees another's maxes, because Beginner's are kilos per dumbbell and
 * MASS's are total on the bar (`narrowMaxes`).
 */
export function reviewProgression(
  exercises: ClusterExercise[],
  maxes: Record<string, OneRmEntry>,
  blockSessions: SessionLog[],
): ProgressionReview {
  const candidates: ProgressionCandidate[] = []
  const missing: string[] = []

  for (const ex of exercises) {
    const entry = maxes[ex.id]
    if (!entry) {
      missing.push(ex.name)
      continue
    }
    // Weighted bodyweight is NOT blocked: its max is a system max in kg, so
    // kilos genuinely apply to it (p.90).
    const blocked =
      ex.defaultLoading === 'bodyweightReps'
        ? 'Bodyweight work is a percentage of max reps (p.90) — the book gives no rep increment. Re-test your max reps instead.'
        : ex.defaultLoading === 'unloaded'
          ? 'No load is prescribed for this one.'
          : undefined

    candidates.push({
      exerciseId: ex.id,
      exerciseName: ex.name,
      entry,
      currentKg: currentMaxKg(entry),
      struggled: markedStruggled(blockSessions, ex.name),
      shortSets: shortSetsInBlock(blockSessions, ex.name),
      fullKg: incrementForKg(ex.bodyPart),
      blocked,
    })
  }

  return { candidates, missing }
}

/**
 * What the app proposes for one lift.
 *
 * `full` — a clean block, so take the whole increment. That is the book's own
 *   default: Forced Progression is the mechanism the protocol works by (p.90),
 *   with the struggle clause as the exception, so it is the exception that has
 *   to be evidenced.
 * `eased` — sets were logged short of the rest of their own session. Half the
 *   increment instead of the whole thing.
 * `hold` — the lifter marked the lift a struggle, so "use the same numbers for
 *   the next block" (p.53). Also covers a lift that cannot take kilos at all.
 */
export type ProgressionChoice = 'full' | 'eased' | 'hold'

/**
 * **DEVIATION — the middle gear is ours.** See docs/mass-design.md §12.
 *
 * The book's rule is binary: progress, or hold. `eased` sits between them, for
 * the case where the lift was not flagged but the LOG shows it was not clean
 * either. It does not contradict p.53 so much as apply it more gently, and it
 * exists because the increments above run near the top of the book's range —
 * a faster base rate is only defensible if something can brake it.
 *
 * The `hold` half is the book's, verbatim. Only `eased` is an addition.
 */
export function suggestChoice(c: ProgressionCandidate): ProgressionChoice {
  if (c.blocked || c.struggled) return 'hold'
  if (c.shortSets > 0) return 'eased'
  return 'full'
}

/** The kilos a choice actually adds. `eased` is half, rounded to 0.1 kg. */
export function kgForChoice(c: ProgressionCandidate, choice: ProgressionChoice): number {
  if (choice === 'hold') return 0
  return choice === 'eased' ? round1(c.fullKg / 2) : c.fullKg
}

/** Why the app proposed what it did, for the UI to show next to the lift. */
export function reasonForChoice(c: ProgressionCandidate, choice: ProgressionChoice): string {
  if (c.blocked) return c.blocked
  if (choice === 'hold' && c.struggled)
    return 'You marked this a struggle — the book says use the same numbers again (p.53).'
  if (choice === 'hold') return 'Held at the same numbers.'
  if (choice === 'eased')
    return `${c.shortSets} set${c.shortSets === 1 ? '' : 's'} logged short of the rest — easing off rather than holding.`
  return c.fullKg === PROGRESSION_MAX_KG
    ? 'Clean block · lower body, so the top of the book’s range'
    : 'Clean block'
}
