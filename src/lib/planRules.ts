/**
 * What makes a block plan a valid one — audit A15, docs/mass-design.md §11.4.
 *
 * Two tiers, and the tier is decided by whether the book states a FACT or gives
 * ADVICE. That distinction is the whole rebuild in miniature: the app must never
 * look like it is inventing a prescription, and it must never hide a choice the
 * author deliberately handed over.
 *
 *   BLOCKED — the book states these:
 *     "Both General and Specificity consist of 3-week blocks"      (p.40, p.67)
 *     Bridge Week is "simply taking a week off in between Blocks"  (p.92)
 *   plus two rules the book does not state because the book is not software:
 *     block length must be a positive integer  (A17: GM_GRID[1.5] blanks the day)
 *     the plan starts on a Monday              (A16: a Wednesday start puts Grey
 *                                               Man's Mon/Wed/Fri on Wed/Fri/Sun
 *                                               and still labels them "Mon")
 *
 *   WARNED — the book advises, and hands the choice over:
 *     "you can set-up a more customized ratio between General and
 *      Specificity as needed"                                      (p.140)
 *     "I don't recommend excluding General completely"             (p.41)
 *     bridge "as needed", roughly every two to three months        (p.93)
 *     2:1 General:Specificity is the "solid balanced approach"     (p.142)
 */
import type { Protocol } from '../protocol'
import type { PlannedBlock } from '../program'

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

/**
 * A named starting point.
 *
 * A LIST, not a constant, at Josh's instruction (2026-08-24): *"we can have more
 * than one default (depending on current goal)."* It holds one entry today
 * because Specificity is not built; adding the full p.140 Standard Cycle and a
 * 2:1 ratio preset must then be data, not a rewrite. See backlog E6.
 *
 * `cite` is mandatory. A preset with no page reference is not a preset — it is
 * an opinion wearing the book's clothes.
 */
export interface PlanPreset {
  id: string
  name: string
  /** The goal it serves, shown under the name. */
  goal: string
  blocks: PlannedBlock[]
  cite: string
  /** Anything the user should know about how it differs from the printed cycle. */
  note?: string
}

export const PLAN_PRESETS: PlanPreset[] = [
  {
    id: 'standard-general',
    name: 'Standard Cycle',
    goal: 'Building overall size — the author’s recommendation for a first cycle',
    // p.140 prints "General — 6 Weeks" twice, and this project already settled
    // (extraction, cross-chapter reconciliation §1; p.40, p.67) that a 6-week
    // General stint IS two 3-week blocks. So blocks 1-2 of the printed cycle are
    // these four, and the printed cycle's block 3 is the Bridge.
    blocks: [
      { protocolId: 'gm', weeks: 3 },
      { protocolId: 'gm', weeks: 3 },
      { protocolId: 'gm', weeks: 3 },
      { protocolId: 'gm', weeks: 3 },
      { protocolId: 'bridge', weeks: 1 },
    ],
    cite: 'p.140',
    note: 'The printed cycle turns to Specificity after this bridge week. Specificity isn’t built yet, so the plan stops here and asks you what to do next.',
  },
]

// ---------------------------------------------------------------------------
// Hard rules
// ---------------------------------------------------------------------------

export interface PlanProblem {
  /** `error` refuses the plan; `warning` explains and permits it. */
  level: 'error' | 'warning'
  message: string
  /** Index of the offending block, when it is one block's fault. */
  blockIndex?: number
}

/**
 * The length this protocol's blocks must be, or `undefined` where the app has no
 * opinion. Read from the protocol itself rather than hardcoded, so a template
 * added later cannot silently disagree with its own declaration.
 */
export const requiredWeeks = (p: Protocol): number | undefined =>
  p.blockWeeks > 0 && p.family !== 'legacy' ? p.blockWeeks : undefined

/**
 * Everything wrong with a plan, worst first.
 *
 * `protocolFor` is injected rather than imported to keep this module free of the
 * protocol registry — `src/program.ts` already imports from here.
 */
export function validatePlan(
  blocks: PlannedBlock[],
  protocolFor: (id: string) => Protocol,
  /** The plan's start, when there is one to check. Omitted for a preset. */
  startDate?: string,
  /** Injected so this module stays free of lib/date. Monday=0 … Sunday=6. */
  mondayIndexOf?: (isoDateStr: string) => number,
): PlanProblem[] {
  const problems: PlanProblem[] = []

  if (blocks.length === 0) {
    problems.push({ level: 'error', message: 'A plan needs at least one block.' })
    return problems
  }

  // A16. New writes snap to a Monday, but a plan already stored — from a backup,
  // an older build, a hand edit — can still start mid-week, and that does not
  // shift the plan, it ROTATES it: Grey Man's Mon/Wed/Fri lands on Wed/Fri/Sun
  // while the app still labels the first day "Mon". Say so where it is visible.
  if (startDate && mondayIndexOf && mondayIndexOf(startDate) !== 0) {
    problems.push({
      level: 'error',
      message:
        'This plan starts mid-week, which rotates the whole training week — Grey Man’s Mon/Wed/Fri would land on other days while still being labelled Mon. Pick a Monday.',
    })
  }

  blocks.forEach((b, i) => {
    const p = protocolFor(b.protocolId)
    const n = b.weeks

    if (!Number.isInteger(n) || n < 1) {
      // A17: GM_GRID[1.5] is undefined and the session renders blank.
      problems.push({
        level: 'error',
        blockIndex: i,
        message: `Block ${i + 1} is ${n} weeks. A block has to be a whole number of weeks.`,
      })
      return
    }

    const need = requiredWeeks(p)
    if (need != null && n !== need) {
      problems.push({
        level: 'error',
        blockIndex: i,
        message:
          p.id === 'bridge'
            ? `A bridge week is one week — “simply taking a week off in between Blocks” (p.92).`
            : `${p.name} blocks are ${need} weeks: “Both General and Specificity consist of 3-week blocks” (p.40). A longer stint is more blocks, not a longer one.`,
      })
    }
  })

  // --- advice, not law ---

  const training = blocks.filter((b) => protocolFor(b.protocolId).family !== 'base')
  const general = training.filter((b) => protocolFor(b.protocolId).family === 'general')
  const specificity = training.filter((b) => protocolFor(b.protocolId).family === 'specificity')

  if (training.length > 0 && general.length === 0) {
    problems.push({
      level: 'warning',
      message:
        'No General blocks. “I don’t recommend excluding General completely” (p.41) — General builds overall size, Specificity is the detail work (p.143).',
    })
  }

  if (general.length > 0 && specificity.length > 0) {
    const ratio = general.length / specificity.length
    if (ratio < 1) {
      problems.push({
        level: 'warning',
        message: `This plan favours Specificity ${specificity.length}:${general.length}. The author’s balanced recommendation is 2:1 the other way, and “spend more time in General the farther away you are from your target weight” (pp.141–142).`,
      })
    }
  }

  // Bridge cadence — "every two to three months" (p.93). 13 weeks is three months.
  const MAX_WEEKS_WITHOUT_BRIDGE = 13
  let run = 0
  blocks.forEach((b, i) => {
    if (protocolFor(b.protocolId).id === 'bridge') {
      run = 0
      return
    }
    run += Math.max(1, b.weeks)
    if (run > MAX_WEEKS_WITHOUT_BRIDGE) {
      problems.push({
        level: 'warning',
        blockIndex: i,
        message: `${run} weeks of training with no bridge week. The author suggests one every two to three months (p.93) — “Too much rest is better than not enough” (p.147).`,
      })
      run = 0 // report once per run, not once per block after the threshold
    }
  })

  return problems.sort((a, b) => (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1))
}

export const planHasErrors = (problems: PlanProblem[]): boolean =>
  problems.some((p) => p.level === 'error')
